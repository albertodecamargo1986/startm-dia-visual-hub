
CREATE TABLE public.cleanup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL,
  bucket text NOT NULL,
  total_orphans int DEFAULT 0,
  bytes_freed bigint DEFAULT 0,
  errors int DEFAULT 0,
  details jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cleanup_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleanup reports: admin read" ON public.cleanup_reports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
