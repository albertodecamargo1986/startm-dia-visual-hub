import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const notificationCode = params.get("notificationCode");
    const notificationType = params.get("notificationType");

    if (notificationType !== "transaction" || !notificationCode) {
      return new Response("OK", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    if (!statusMatch || !referenceMatch) {
      console.error("Could not parse PagSeguro notification:", xml);
      return new Response("OK", { status: 200 });
    }

    const pgStatus = parseInt(statusMatch[1]);
    const orderNumber = referenceMatch[1];
    const transactionCode = transCodeMatch?.[1] || "";

    // PagSeguro: 1=aguardando, 2=análise, 3=paga, 4=disponível, 5=disputa, 6=devolvida, 7=cancelada
    let paymentStatus = "pending";
    let orderStatus = "pending_payment";

    if (pgStatus === 3 || pgStatus === 4) {
      paymentStatus = "paid";
      orderStatus = "awaiting_artwork";
    } else if (pgStatus === 2) {
      // "analyzing" não é válido no banco — manter como pending
      paymentStatus = "pending";
      orderStatus = "pending_payment";
    } else if (pgStatus === 5) {
      // Disputa — manter status atual, apenas registrar na timeline
      paymentStatus = "pending";
      orderStatus = "pending_payment";
    } else if (pgStatus === 6 || pgStatus === 7) {
      paymentStatus = "refunded";
      orderStatus = "cancelled";
    }

    // Só atualizar o banco se o status realmente mudou (evitar sobrescrever paid com pending)
    const shouldUpdate = pgStatus === 3 || pgStatus === 4 || pgStatus === 6 || pgStatus === 7;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (shouldUpdate) {
      const { data: order } = await supabase
        .from("orders")
        .update({
          payment_status: paymentStatus,
          status: orderStatus,
          payment_id: transactionCode,
        })
        .eq("order_number", orderNumber)
        .select()
        .single();

      if (order) {
        const messages: Record<string, string> = {
          paid: "✅ Pagamento confirmado! Aguardando envio de arte.",
          refunded: "❌ Pagamento cancelado ou estornado.",
        };
        await supabase.from("order_timeline").insert({
          order_id: order.id,
          status: orderStatus,
          message: messages[paymentStatus] || `Pagamento: ${paymentStatus}`,
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
