import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package, FileText, User, LayoutDashboard, LogOut, Tag } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const clientLinks = [
  { to: '/cliente', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cliente/pedidos', label: 'Meus Pedidos', icon: Package },
  { to: '/cliente/arquivos', label: 'Meus Arquivos', icon: FileText },
  { to: '/cliente/etiquetas', label: 'Etiquetas', icon: Tag },
  { to: '/cliente/perfil', label: 'Meu Perfil', icon: User },
];

const ClientLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const initials = (profile?.full_name || 'C')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container py-8">
      {/* Mobile: horizontal tabs */}
      <div className="md:hidden mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg truncate">{profile?.full_name || 'Cliente'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {clientLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${pathname === l.to ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex md:w-60 flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-12 w-12">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-display text-lg truncate">{profile?.full_name || 'Cliente'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-1 flex-1">
            {clientLinks.map(l => (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${pathname === l.to ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                <l.icon className="h-4 w-4" />{l.label}
              </Link>
            ))}
          </div>

          <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-destructive mt-4" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />Sair
          </Button>
        </nav>

        <div className="flex-1 min-w-0"><Outlet /></div>
      </div>
    </div>
  );
};

export default ClientLayout;
