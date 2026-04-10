
CREATE TABLE public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'pagseguro',
  provider_event_id text NOT NULL,
  transaction_code text DEFAULT '',
  pg_status int,
  order_number text DEFAULT '',
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received',
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text DEFAULT '',
  UNIQUE(provider, provider_event_id)
);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhook events: admin read" ON public.payment_webhook_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
