
-- Portfolio items table
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  item_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio: public read active"
  ON public.portfolio_items FOR SELECT TO public
  USING (active = true);

CREATE POLICY "Portfolio: admin write"
  ON public.portfolio_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Contact requests table
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  product TEXT DEFAULT '',
  message TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contact requests: anyone can insert"
  ON public.contact_requests FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Contact requests: admin read"
  ON public.contact_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
