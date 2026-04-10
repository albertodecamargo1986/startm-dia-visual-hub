
CREATE TABLE IF NOT EXISTS public.label_filter_preferences (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  template_filters jsonb DEFAULT '{}'::jsonb,
  format_filters   jsonb DEFAULT '{}'::jsonb,
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.label_filter_preferences ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_label_filter_prefs_user ON public.label_filter_preferences (user_id);

CREATE POLICY "users_own_preferences"
  ON public.label_filter_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
