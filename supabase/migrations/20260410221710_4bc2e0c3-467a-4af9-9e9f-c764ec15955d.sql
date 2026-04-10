
CREATE TABLE public.label_custom_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  shape text NOT NULL DEFAULT 'round',
  width_mm numeric NOT NULL,
  height_mm numeric NOT NULL,
  width_px integer,
  height_px integer,
  corner_radius_mm numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.label_custom_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom formats: user owns"
  ON public.label_custom_formats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Custom formats: admin read all"
  ON public.label_custom_formats
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
