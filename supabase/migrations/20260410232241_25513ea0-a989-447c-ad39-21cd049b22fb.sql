
CREATE TABLE IF NOT EXISTS public.label_gradient_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        text NOT NULL,
  direction   text NOT NULL,
  stops       jsonb NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.label_gradient_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_gradients"
  ON public.label_gradient_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gradient_favorites_user
  ON public.label_gradient_favorites(user_id);
