import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package, FileText, User, LayoutDashboard } from 'lucide-react';

const clientLinks = [
  { to: '/cliente', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cliente/pedidos', label: 'Meus Pedidos', icon: Package },
  { to: '/cliente/arquivos', label: 'Meus Arquivos', icon: FileText },
  { to: '/cliente/perfil', label: 'Meu Perfil', icon: User },
];

const ClientLayout = () => {
  const { pathname } = useLocation();
  const { profile } = useAuth();

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl mb-6">Olá, <span className="text-primary">{profile?.full_name || 'Cliente'}</span></h1>
      <div className="flex flex-col md:flex-row gap-8">
        <nav className="md:w-56 space-y-1">
          {clientLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${pathname === l.to ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1"><Outlet /></div>
      </div>
    </div>
  );
};

export default ClientLayout;
