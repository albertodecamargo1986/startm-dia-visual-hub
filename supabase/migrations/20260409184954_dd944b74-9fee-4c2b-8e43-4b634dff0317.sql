
-- 1. Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 2. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  cpf_cnpj text DEFAULT '',
  company_name text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: own read/write" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 3. Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  image_url text DEFAULT '',
  cat_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories: public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories: admin write" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 4. Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text DEFAULT '',
  description text DEFAULT '',
  base_price numeric(10,2) DEFAULT 0,
  price_unit text DEFAULT 'unidade',
  min_quantity integer DEFAULT 1,
  images text[] DEFAULT ARRAY[]::text[],
  thumbnail text DEFAULT '',
  tags text[] DEFAULT ARRAY[]::text[],
  active boolean DEFAULT true,
  featured boolean DEFAULT false,
  needs_artwork boolean DEFAULT true,
  has_custom_size boolean DEFAULT false,
  production_days integer DEFAULT 3,
  weight_g integer DEFAULT 100,
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  prod_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products: public read active" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Products: admin all" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 5. Banners
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  subtitle text DEFAULT '',
  image_url text NOT NULL,
  link_url text DEFAULT '',
  button_text text DEFAULT '',
  active boolean DEFAULT true,
  banner_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Banners: public read" ON public.banners FOR SELECT USING (active = true);
CREATE POLICY "Banners: admin write" ON public.banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 6. Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment','awaiting_artwork','in_production','ready','shipped','delivered','cancelled','refunded')),
  payment_status text DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method text DEFAULT '',
  payment_id text DEFAULT '',
  subtotal numeric(10,2) DEFAULT 0,
  shipping numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  shipping_address jsonb DEFAULT '{}'::jsonb,
  notes text DEFAULT '',
  admin_notes text DEFAULT '',
  estimated_delivery date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders: customer sees own" ON public.orders
  FOR SELECT TO authenticated
  USING (customer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Orders: customer insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Orders: admin all" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 7. Order Items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  product_snapshot jsonb DEFAULT '{}'::jsonb,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  custom_width numeric(8,2),
  custom_height numeric(8,2),
  artwork_url text DEFAULT '',
  artwork_status text DEFAULT 'pending'
    CHECK (artwork_status IN ('pending','approved','rejected','not_required')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items: customer sees own" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())));
CREATE POLICY "Order items: admin all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 8. Customer Files
CREATE TABLE public.customer_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  order_item_id uuid REFERENCES public.order_items(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer DEFAULT 0,
  file_type text DEFAULT '',
  category text DEFAULT 'artwork'
    CHECK (category IN ('artwork','reference','approved','other')),
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','in_review')),
  admin_comment text DEFAULT '',
  uploaded_at timestamptz DEFAULT now()
);
ALTER TABLE public.customer_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Files: customer sees own" ON public.customer_files
  FOR ALL TO authenticated
  USING (customer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (customer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Files: admin all" ON public.customer_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 9. Order Timeline
CREATE TABLE public.order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timeline: customer sees own order" ON public.order_timeline
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())));
CREATE POLICY "Timeline: admin all" ON public.order_timeline
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 10. Site Settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings: public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Settings: admin write" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 11. Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Order number generator
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'SM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_number_seq')::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 13. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-files', 'customer-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('artwork-files', 'artwork-files', false);

-- Storage policies
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admin delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admin upload banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admin delete banners" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Customer read own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'customer-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Customer upload own files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'customer-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admin read all customer files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'customer-files' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Customer read own artwork" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'artwork-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Customer upload own artwork" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'artwork-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admin read all artwork" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'artwork-files' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

-- 15. Seed data: categories
INSERT INTO public.categories (name, slug, icon, cat_order) VALUES
  ('Adesivos', 'adesivos', 'Sticker', 1),
  ('Banners e Lonas', 'banners-lonas', 'Flag', 2),
  ('Placas de Sinalização', 'placas', 'SignpostBig', 3),
  ('Etiquetas e Rótulos', 'etiquetas-rotulos', 'Tag', 4),
  ('Fachadas e ACM', 'fachadas-acm', 'Building2', 5),
  ('Envelopamento', 'envelopamento', 'Car', 6),
  ('Personalização', 'personalizacao', 'Pen', 7);

-- 16. Seed data: site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_number', '5519983649875'),
  ('whatsapp_message', 'Olá! Gostaria de solicitar um orçamento.'),
  ('email_contato', 'contato@startmidialimeira.com.br'),
  ('endereco', 'Limeira - SP'),
  ('telefone_alberto', '(19) 98364-9875'),
  ('telefone_felipe', '(19) 98163-1066'),
  ('instagram_url', 'https://instagram.com/startmidialimeira'),
  ('facebook_url', ''),
  ('pagseguro_email', ''),
  ('pagseguro_token', ''),
  ('pagseguro_sandbox', 'true');
