-- Admin can read all label projects
CREATE POLICY "label_projects: admin read all"
ON public.label_projects
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admin can read all label project versions
CREATE POLICY "label_versions: admin read all"
ON public.label_project_versions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
