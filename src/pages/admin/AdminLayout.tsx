import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Layers, Image, Users, FileText, Settings } from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Package },
  { to: '/admin/produtos', label: 'Produtos', icon: ShoppingBag },
  { to: '/admin/categorias', label: 'Categorias', icon: Layers },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/arquivos', label: 'Arquivos', icon: FileText },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

const AdminLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl mb-6">Painel <span className="text-primary">Admin</span></h1>
      <div className="flex flex-col md:flex-row gap-8">
        <nav className="md:w-56 space-y-1">
          {adminLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${pathname === l.to ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1 min-w-0"><Outlet /></div>
      </div>
    </div>
  );
};

export default AdminLayout;
