
-- Create audit log table
CREATE TABLE public.cms_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id uuid NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  before_data jsonb NULL,
  after_data jsonb NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cms_audit_entity ON public.cms_audit_log(entity_type, entity_id);
CREATE INDEX idx_cms_audit_created ON public.cms_audit_log(created_at DESC);

ALTER TABLE public.cms_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "CMS audit: admin read"
  ON public.cms_audit_log FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Add soft delete to cms_pages
ALTER TABLE public.cms_pages ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

-- Update public read policy to exclude soft-deleted
DROP POLICY IF EXISTS "CMS pages: public read published" ON public.cms_pages;
CREATE POLICY "CMS pages: public read published"
  ON public.cms_pages FOR SELECT
  TO public
  USING (status = 'published' AND deleted_at IS NULL);
