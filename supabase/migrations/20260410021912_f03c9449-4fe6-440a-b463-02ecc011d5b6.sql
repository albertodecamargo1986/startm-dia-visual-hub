
-- Notifications queue table
CREATE TABLE public.notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  recipient_type text NOT NULL,
  recipient_email text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 5,
  next_retry_at timestamptz DEFAULT now(),
  last_error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: admin read" ON public.notifications_queue
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_notifications_pending ON public.notifications_queue (status, next_retry_at)
  WHERE status = 'pending';

-- Trigger function: enqueue notifications on order status change
CREATE OR REPLACE FUNCTION public.enqueue_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type text;
  v_customer_email text;
  v_customer_name text;
  v_admin_emails text[];
  v_admin_email text;
  v_order_number text;
  v_notify_admin boolean := false;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map order status to event type
  CASE NEW.status
    WHEN 'pending_payment' THEN v_event_type := 'pedido_criado'; v_notify_admin := true;
    WHEN 'awaiting_artwork' THEN v_event_type := 'pagamento_confirmado';
    WHEN 'in_production' THEN v_event_type := 'arte_aprovada';
    WHEN 'shipped' THEN v_event_type := 'pedido_enviado';
    WHEN 'cancelled' THEN v_event_type := 'pedido_cancelado'; v_notify_admin := true;
    WHEN 'refunded' THEN v_event_type := 'pedido_cancelado'; v_notify_admin := true;
    ELSE RETURN NEW; -- no notification for other statuses
  END CASE;

  -- Get customer info
  SELECT p.email, p.full_name INTO v_customer_email, v_customer_name
  FROM public.profiles p
  WHERE p.id = NEW.customer_id;

  -- Get order number
  v_order_number := NEW.order_number;

  -- Enqueue customer notification
  IF v_customer_email IS NOT NULL AND v_customer_email != '' THEN
    INSERT INTO public.notifications_queue (order_id, event_type, recipient_type, recipient_email, payload)
    VALUES (
      NEW.id, v_event_type, 'customer', v_customer_email,
      jsonb_build_object(
        'customerName', COALESCE(v_customer_name, ''),
        'orderNumber', v_order_number,
        'status', NEW.status,
        'orderId', NEW.id
      )
    );
  END IF;

  -- Enqueue admin notification(s) for relevant events
  IF v_notify_admin THEN
    SELECT array_agg(p.email) INTO v_admin_emails
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.role IN ('admin', 'super_admin')
    AND p.email IS NOT NULL AND p.email != '';

    IF v_admin_emails IS NOT NULL THEN
      FOREACH v_admin_email IN ARRAY v_admin_emails LOOP
        INSERT INTO public.notifications_queue (order_id, event_type, recipient_type, recipient_email, payload)
        VALUES (
          NEW.id, v_event_type, 'admin', v_admin_email,
          jsonb_build_object(
            'customerName', COALESCE(v_customer_name, ''),
            'orderNumber', v_order_number,
            'status', NEW.status,
            'orderId', NEW.id
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER trg_order_status_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_order_notification();

-- Also fire on INSERT for new orders (pedido_criado)
CREATE OR REPLACE FUNCTION public.enqueue_new_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_email text;
  v_customer_name text;
  v_admin_emails text[];
  v_admin_email text;
BEGIN
  -- Get customer info
  SELECT p.email, p.full_name INTO v_customer_email, v_customer_name
  FROM public.profiles p
  WHERE p.id = NEW.customer_id;

  -- Customer notification
  IF v_customer_email IS NOT NULL AND v_customer_email != '' THEN
    INSERT INTO public.notifications_queue (order_id, event_type, recipient_type, recipient_email, payload)
    VALUES (
      NEW.id, 'pedido_criado', 'customer', v_customer_email,
      jsonb_build_object(
        'customerName', COALESCE(v_customer_name, ''),
        'orderNumber', NEW.order_number,
        'status', NEW.status,
        'orderId', NEW.id
      )
    );
  END IF;

  -- Admin notification
  SELECT array_agg(p.email) INTO v_admin_emails
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role IN ('admin', 'super_admin')
  AND p.email IS NOT NULL AND p.email != '';

  IF v_admin_emails IS NOT NULL THEN
    FOREACH v_admin_email IN ARRAY v_admin_emails LOOP
      INSERT INTO public.notifications_queue (order_id, event_type, recipient_type, recipient_email, payload)
      VALUES (
        NEW.id, 'pedido_criado', 'admin', v_admin_email,
        jsonb_build_object(
          'customerName', COALESCE(v_customer_name, ''),
          'orderNumber', NEW.order_number,
          'status', NEW.status,
          'orderId', NEW.id
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_order_notification
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_new_order_notification();
