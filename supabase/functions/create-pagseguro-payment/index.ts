import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", order.customer_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pagseguroEmail = Deno.env.get("PAGSEGURO_EMAIL");
    const pagseguroToken = Deno.env.get("PAGSEGURO_TOKEN");
    const isSandbox = Deno.env.get("PAGSEGURO_SANDBOX") === "true";
    const siteUrl = Deno.env.get("SITE_URL") || "https://startmidia.com.br";

    if (!pagseguroEmail || !pagseguroToken) {
      return new Response(JSON.stringify({ error: "PagSeguro não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = isSandbox
      ? "https://ws.sandbox.pagseguro.uol.com.br"
      : "https://ws.pagseguro.uol.com.br";

    const itemsXml = order.order_items
      .map(
        (item: any, i: number) => `
      <item>
        <id>${i + 1}</id>
        <description>${item.product_name.substring(0, 100).replace(/[&<>"']/g, '')}</description>
        <amount>${Number(item.unit_price).toFixed(2)}</amount>
        <quantity>${item.quantity}</quantity>
        <weight>0</weight>
      </item>`
      )
      .join("");

    const senderName = profile.full_name || "Cliente";
    const senderEmail = isSandbox ? "c98teleqh@sandbox.pagseguro.com.br" : profile.email;

    const xml = `<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<checkout>
  <currency>BRL</currency>
  <reference>${order.order_number}</reference>
  <sender>
    <name>${senderName.replace(/[&<>"']/g, '')}</name>
    <email>${senderEmail}</email>
  </sender>
  <items>${itemsXml}
  </items>
  <redirectURL>${siteUrl}/checkout/sucesso?order=${orderId}</redirectURL>
  <notificationURL>${supabaseUrl}/functions/v1/pagseguro-webhook</notificationURL>
</checkout>`;

    const response = await fetch(
      `${baseUrl}/v2/checkout?email=${pagseguroEmail}&token=${pagseguroToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/xml; charset=ISO-8859-1" },
        body: xml,
      }
    );

    const responseText = await response.text();
    const codeMatch = responseText.match(/<code>(.*?)<\/code>/);

    if (!codeMatch) {
      console.error("PagSeguro error:", responseText);
      return new Response(
        JSON.stringify({ error: "Erro ao criar pagamento PagSeguro", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const checkoutCode = codeMatch[1];
    const redirectUrl = isSandbox
      ? `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCode}`
      : `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCode}`;

    await supabase
      .from("orders")
      .update({ payment_id: checkoutCode, payment_method: "pagseguro" })
      .eq("id", orderId);

    return new Response(JSON.stringify({ redirectUrl, code: checkoutCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
