import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  paid: 1,
  refunded: 2,
};

function log(data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...data }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const notificationCode = params.get("notificationCode");
    const notificationType = params.get("notificationType");

    if (notificationType !== "transaction" || !notificationCode) {
      log({ event: "ignored", reason: "not a transaction notification", notificationType });
      return new Response("OK", { status: 200 });
    }

    // 1. Idempotency — try to insert event; if duplicate, skip
    const { error: insertErr } = await supabase
      .from("payment_webhook_events")
      .insert({
        provider: "pagseguro",
        provider_event_id: notificationCode,
        status: "received",
      });

    if (insertErr) {
      if (insertErr.code === "23505") {
        log({ event: "duplicate", notificationCode, action: "skipped" });
        return new Response("OK", { status: 200 });
      }
      log({ event: "db_insert_error", notificationCode, error: insertErr.message });
    }

    // 2. Validate origin — fetch transaction from PagSeguro API
    const pagseguroEmail = Deno.env.get("PAGSEGURO_EMAIL")!;
    const pagseguroToken = Deno.env.get("PAGSEGURO_TOKEN")!;
    const isSandbox = Deno.env.get("PAGSEGURO_SANDBOX") === "true";
    const baseUrl = isSandbox
      ? "https://ws.sandbox.pagseguro.uol.com.br"
      : "https://ws.pagseguro.uol.com.br";

    const response = await fetch(
      `${baseUrl}/v3/transactions/notifications/${notificationCode}?email=${pagseguroEmail}&token=${pagseguroToken}`
    );
    const xml = await response.text();

    const statusMatch = xml.match(/<status>(\d+)<\/status>/);
    const referenceMatch = xml.match(/<reference>(.*?)<\/reference>/);
    const transCodeMatch = xml.match(/<code>(.*?)<\/code>/);

    if (!response.ok || !statusMatch || !referenceMatch || !transCodeMatch) {
      const errMsg = "Invalid PagSeguro response: missing required fields";
      log({ event: "validation_failed", notificationCode, httpStatus: response.status, error: errMsg });
      await supabase
        .from("payment_webhook_events")
        .update({ status: "error", error_message: errMsg, processed_at: new Date().toISOString() })
        .eq("provider", "pagseguro")
        .eq("provider_event_id", notificationCode);
      return new Response("OK", { status: 200 });
    }

    const pgStatus = parseInt(statusMatch[1]);
    const orderNumber = referenceMatch[1];
    const transactionCode = transCodeMatch[1];

    // Update event record with parsed data
    await supabase
      .from("payment_webhook_events")
      .update({
        transaction_code: transactionCode,
        pg_status: pgStatus,
        order_number: orderNumber,
        payload: { xml_length: xml.length, http_status: response.status },
      })
      .eq("provider", "pagseguro")
      .eq("provider_event_id", notificationCode);

    // 3. Map PagSeguro status
    // 1=waiting, 2=analysis, 3=paid, 4=available, 5=dispute, 6=refunded, 7=cancelled
    let newPaymentStatus = "pending";
    let newOrderStatus = "pending_payment";

    if (pgStatus === 3 || pgStatus === 4) {
      newPaymentStatus = "paid";
      newOrderStatus = "awaiting_artwork";
    } else if (pgStatus === 6 || pgStatus === 7) {
      newPaymentStatus = "refunded";
      newOrderStatus = "cancelled";
    }

    // Only process definitive statuses
    const isDefinitive = pgStatus === 3 || pgStatus === 4 || pgStatus === 6 || pgStatus === 7;
    if (!isDefinitive) {
      log({ event: "non_definitive", notificationCode, transactionCode, orderNumber, pgStatus, action: "skipped" });
      await supabase
        .from("payment_webhook_events")
        .update({ status: "skipped", error_message: `Non-definitive pgStatus=${pgStatus}`, processed_at: new Date().toISOString() })
        .eq("provider", "pagseguro")
        .eq("provider_event_id", notificationCode);
      return new Response("OK", { status: 200 });
    }

    // 4. Status downgrade protection
    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_status, status")
      .eq("order_number", orderNumber)
      .single();

    if (!order) {
      const errMsg = `Order not found: ${orderNumber}`;
      log({ event: "order_not_found", notificationCode, orderNumber, error: errMsg });
      await supabase
        .from("payment_webhook_events")
        .update({ status: "error", error_message: errMsg, processed_at: new Date().toISOString() })
        .eq("provider", "pagseguro")
        .eq("provider_event_id", notificationCode);
      return new Response("OK", { status: 200 });
    }

    const currentRank = STATUS_RANK[order.payment_status ?? "pending"] ?? 0;
    const newRank = STATUS_RANK[newPaymentStatus] ?? 0;

    if (newRank <= currentRank) {
      log({ event: "downgrade_blocked", notificationCode, orderNumber, currentStatus: order.payment_status, newStatus: newPaymentStatus, action: "skipped" });
      await supabase
        .from("payment_webhook_events")
        .update({ status: "skipped", error_message: `Downgrade blocked: ${order.payment_status} → ${newPaymentStatus}`, processed_at: new Date().toISOString() })
        .eq("provider", "pagseguro")
        .eq("provider_event_id", notificationCode);
      return new Response("OK", { status: 200 });
    }

    // 5. Update order
    await supabase
      .from("orders")
      .update({
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        payment_id: transactionCode,
      })
      .eq("id", order.id);

    const messages: Record<string, string> = {
      paid: "✅ Pagamento confirmado! Aguardando envio de arte.",
      refunded: "❌ Pagamento cancelado ou estornado.",
    };

    await supabase.from("order_timeline").insert({
      order_id: order.id,
      status: newOrderStatus,
      message: messages[newPaymentStatus] || `Pagamento: ${newPaymentStatus}`,
    });

    log({ event: "processed", notificationCode, transactionCode, orderNumber, pgStatus, newPaymentStatus, newOrderStatus });

    await supabase
      .from("payment_webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("provider", "pagseguro")
      .eq("provider_event_id", notificationCode);

    return new Response("OK", { status: 200 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log({ event: "unhandled_error", error: errMsg });
    return new Response("OK", { status: 200 });
  }
});
