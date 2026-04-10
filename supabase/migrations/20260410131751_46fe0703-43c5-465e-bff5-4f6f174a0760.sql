
-- Label projects table
CREATE TABLE public.label_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Sem título',
  status text NOT NULL DEFAULT 'draft',
  label_shape text NOT NULL DEFAULT 'round',
  width_mm numeric NOT NULL DEFAULT 50,
  height_mm numeric NOT NULL DEFAULT 50,
  canvas_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.label_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "label_projects: user owns" ON public.label_projects
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_label_projects_updated_at
  BEFORE UPDATE ON public.label_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_label_projects_user ON public.label_projects(user_id);

-- Label project versions table
CREATE TABLE public.label_project_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.label_projects(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.label_project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "label_versions: user owns via project" ON public.label_project_versions
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM public.label_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM public.label_projects WHERE user_id = auth.uid()));

CREATE INDEX idx_label_versions_project ON public.label_project_versions(project_id);
