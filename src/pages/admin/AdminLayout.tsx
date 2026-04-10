import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { LayoutDashboard, Package, ShoppingBag, Layers, Image, Users, FileText, Settings, Menu, ExternalLink, Palette, FileEdit, Paintbrush, BarChart3 } from 'lucide-react';
import { useState } from 'react';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Package },
  { to: '/admin/produtos', label: 'Produtos', icon: ShoppingBag },
  { to: '/admin/categorias', label: 'Categorias', icon: Layers },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/portfolio', label: 'Portfólio', icon: Palette },
  { to: '/admin/arquivos', label: 'Arquivos', icon: FileText },
  { to: '/admin/paginas', label: 'Páginas', icon: FileEdit },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/aparencia', label: 'Aparência', icon: Paintbrush },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

const breadcrumbMap: Record<string, string> = {
  admin: 'Admin',
  pedidos: 'Pedidos',
  produtos: 'Produtos',
  categorias: 'Categorias',
  banners: 'Banners',
  clientes: 'Clientes',
  portfolio: 'Portfólio',
  arquivos: 'Arquivos',
  paginas: 'Páginas',
  analytics: 'Analytics',
  aparencia: 'Aparência',
  configuracoes: 'Configurações',
  novo: 'Novo',
};

const SidebarContent = ({ pathname }: { pathname: string }) => {
  const { profile } = useAuth();
  const { getSetting } = useSettings();
  const logoUrl = getSetting('site_logo_url');
  const initials = (profile?.full_name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <Link to="/admin">
          {logoUrl ? (
            <img src={logoUrl} alt="StartMídia" className="h-8 w-auto" />
          ) : (
            <span className="font-display text-xl text-primary">START<span className="text-white">MÍDIA</span></span>
          )}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">Painel Admin</p>
      </div>

      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Admin'}</p>
          <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {adminLinks.map(l => {
          const active = pathname === l.to || (l.to !== '/admin' && pathname.startsWith(l.to));
          return (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-primary text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
              <l.icon className="h-4 w-4 flex-shrink-0" />{l.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
          <ExternalLink className="h-4 w-4" />Ver Site
        </a>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: breadcrumbMap[seg] || seg,
    path: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-gray-900 rounded-lg flex-shrink-0 flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-gray-900 border-gray-700 text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 bg-gray-900 border-gray-700">
            <div onClick={() => setOpen(false)}>
              <SidebarContent pathname={pathname} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pl-0 lg:pl-6">
        {crumbs.length > 1 && (
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              {crumbs.map((c, i) => (
                <BreadcrumbItem key={c.path}>
                  {c.isLast ? (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink asChild><Link to={c.path}>{c.label}</Link></BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
