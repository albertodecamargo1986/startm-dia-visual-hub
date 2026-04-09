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

    // PagSeguro statuses: 1=waiting, 2=analysis, 3=paid, 4=available, 5=dispute, 6=refunded, 7=cancelled
    let paymentStatus = "pending";
    let orderStatus = "pending_payment";

    if (pgStatus === 3 || pgStatus === 4) {
      paymentStatus = "paid";
      orderStatus = "awaiting_artwork";
    } else if (pgStatus === 2) {
      paymentStatus = "analyzing";
      orderStatus = "pending_payment";
    } else if (pgStatus === 6 || pgStatus === 7) {
      paymentStatus = "refunded";
      orderStatus = "cancelled";
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        paid: "✅ Pagamento confirmado! Seu pedido entrou na fila de produção.",
        analyzing: "🔍 Pagamento em análise pelo PagSeguro.",
        pending: "⏳ Aguardando confirmação do pagamento.",
        refunded: "❌ Pagamento cancelado ou estornado.",
      };
      await supabase.from("order_timeline").insert({
        order_id: order.id,
        status: orderStatus,
        message: messages[paymentStatus] || `Status atualizado: ${paymentStatus}`,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
