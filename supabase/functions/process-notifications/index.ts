import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 10;
const BASE_RETRY_SECONDS = 30;

const EVENT_SUBJECTS: Record<string, string> = {
  pedido_criado: "Novo pedido recebido",
  pagamento_confirmado: "Pagamento confirmado",
  aguardando_arte: "Envie seus arquivos de arte",
  arte_aprovada: "Arte aprovada — pedido em produção",
  pedido_enviado: "Seu pedido foi enviado",
  pedido_cancelado: "Pedido cancelado",
};

const EVENT_TEMPLATES: Record<string, string> = {
  pedido_criado: "pedido-criado",
  pagamento_confirmado: "pagamento-confirmado",
  aguardando_arte: "aguardando-arte",
  arte_aprovada: "arte-aprovada",
  pedido_enviado: "pedido-enviado",
  pedido_cancelado: "pedido-cancelado",
};

function log(data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), fn: "process-notifications", ...data }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch pending notifications ready for processing
    const { data: notifications, error: fetchError } = await supabase
      .from("notifications_queue")
      .select("*")
      .eq("status", "pending")
      .lte("next_retry_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      log({ event: "fetch_error", error: fetchError.message });
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      log({ event: "no_pending" });
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    log({ event: "batch_start", count: notifications.length });

    let processed = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const notif of notifications) {
      try {
        const templateName = EVENT_TEMPLATES[notif.event_type];

        if (!templateName) {
          log({ event: "unknown_event", id: notif.id, eventType: notif.event_type });
          await supabase
            .from("notifications_queue")
            .update({ status: "skipped", last_error: `Unknown event type: ${notif.event_type}`, processed_at: new Date().toISOString() })
            .eq("id", notif.id);
          skipped++;
          processed++;
          continue;
        }

        // Try sending via send-transactional-email
        const { error: invokeError } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName,
            recipientEmail: notif.recipient_email,
            idempotencyKey: `order-notif-${notif.id}`,
            templateData: {
              ...(notif.payload as Record<string, unknown>),
              recipientType: notif.recipient_type,
            },
          },
        });

        if (invokeError) {
          throw new Error(invokeError.message || "send-transactional-email invocation failed");
        }

        // Mark as sent
        await supabase
          .from("notifications_queue")
          .update({ status: "sent", processed_at: new Date().toISOString(), attempts: notif.attempts + 1 })
          .eq("id", notif.id);

        log({ event: "sent", id: notif.id, eventType: notif.event_type, recipient: notif.recipient_email });
        sent++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const newAttempts = notif.attempts + 1;

        if (newAttempts >= notif.max_attempts) {
          // Max retries exceeded
          await supabase
            .from("notifications_queue")
            .update({ status: "failed", last_error: errorMsg, attempts: newAttempts, processed_at: new Date().toISOString() })
            .eq("id", notif.id);
          log({ event: "max_retries", id: notif.id, attempts: newAttempts, error: errorMsg });
          failed++;
        } else {
          // Schedule retry with exponential backoff
          const retryDelay = Math.pow(2, newAttempts) * BASE_RETRY_SECONDS;
          const nextRetry = new Date(Date.now() + retryDelay * 1000).toISOString();

          await supabase
            .from("notifications_queue")
            .update({ attempts: newAttempts, last_error: errorMsg, next_retry_at: nextRetry })
            .eq("id", notif.id);
          log({ event: "retry_scheduled", id: notif.id, attempts: newAttempts, nextRetry, error: errorMsg });
          failed++;
        }
      }
      processed++;
    }

    log({ event: "batch_done", processed, sent, failed, skipped });
    return new Response(JSON.stringify({ processed, sent, failed, skipped }), { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log({ event: "unhandled_error", error: errorMsg });
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
});
