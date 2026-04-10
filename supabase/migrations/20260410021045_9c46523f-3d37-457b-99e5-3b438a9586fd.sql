
CREATE OR REPLACE FUNCTION public.create_order_transactional(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_customer_id uuid;
  v_profile_user_id uuid;
  v_item jsonb;
  v_items_result jsonb := '[]'::jsonb;
  v_cart_index int := 0;
  v_inserted_id uuid;
BEGIN
  v_customer_id := (payload->>'customer_id')::uuid;
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'customer_id is required';
  END IF;

  SELECT user_id INTO v_profile_user_id
  FROM public.profiles
  WHERE id = v_customer_id;

  IF v_profile_user_id IS NULL OR v_profile_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: customer does not belong to authenticated user';
  END IF;

  IF payload->'items' IS NULL OR jsonb_array_length(payload->'items') = 0 THEN
    RAISE EXCEPTION 'At least one item is required';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    IF v_item->>'product_name' IS NULL OR v_item->>'product_name' = '' THEN
      RAISE EXCEPTION 'Each item must have a product_name';
    END IF;
    IF (v_item->>'unit_price') IS NULL THEN
      RAISE EXCEPTION 'Each item must have a unit_price';
    END IF;
    IF (v_item->>'quantity') IS NULL OR (v_item->>'quantity')::int < 1 THEN
      RAISE EXCEPTION 'Each item must have a quantity >= 1';
    END IF;
    IF (v_item->>'total_price') IS NULL THEN
      RAISE EXCEPTION 'Each item must have a total_price';
    END IF;
  END LOOP;

  v_order_number := generate_order_number();

  INSERT INTO public.orders (
    order_number, customer_id, subtotal, total,
    shipping_address, notes, status, payment_status
  ) VALUES (
    v_order_number,
    v_customer_id,
    COALESCE((payload->>'subtotal')::numeric, 0),
    COALESCE((payload->>'total')::numeric, 0),
    COALESCE(payload->'shipping_address', '{}'::jsonb),
    COALESCE(payload->>'notes', ''),
    'pending_payment',
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Insert items one by one to capture each generated ID
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_snapshot,
      quantity, unit_price, total_price,
      custom_width, custom_height, notes, artwork_status
    ) VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id', '')::uuid,
      v_item->>'product_name',
      COALESCE(v_item->'product_snapshot', '{}'::jsonb),
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric,
      NULLIF(v_item->>'custom_width', '')::numeric,
      NULLIF(v_item->>'custom_height', '')::numeric,
      COALESCE(v_item->>'notes', ''),
      COALESCE(v_item->>'artwork_status', 'pending')
    ) RETURNING id INTO v_inserted_id;

    v_items_result := v_items_result || jsonb_build_object(
      'cart_index', v_cart_index,
      'order_item_id', v_inserted_id
    );
    v_cart_index := v_cart_index + 1;
  END LOOP;

  INSERT INTO public.order_timeline (order_id, status, message)
  VALUES (v_order_id, 'pending_payment', 'Pedido criado.');

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'items', v_items_result
  );
END;
$function$;
