
CREATE TABLE public.health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Health: admin read"
  ON public.health_checks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role));
