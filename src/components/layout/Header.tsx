import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Search, ShieldCheck, Package, FileText, UserCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { CartButton } from '@/components/CartButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/produtos', label: 'Produtos' },
  { to: '/portfolio', label: 'Portfólio' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/contato', label: 'Contato' },
];

export const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, profile, isAdmin, logout } = useAuth();
  const { getSetting } = useSettings();
  const logoUrl = getSetting('site_logo_url');
  const logoMobile = getSetting('site_logo_mobile');

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="StartMídia" className="h-10 w-auto" />
          ) : (
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl tracking-wider text-primary">STARTMÍDIA</span>
              <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Comunicação Visual</span>
            </div>
          )}
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <div className="relative hidden md:flex items-center">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-1 animate-in slide-in-from-right-4">
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="h-8 w-48 text-sm"
                />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="p-2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Buscar">
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Cart */}
          <CartButton />

          {/* Account desktop */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <button className="p-1 rounded-full ring-2 ring-transparent hover:ring-primary/50 transition-all">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/cliente/pedidos" className="gap-2"><Package className="h-4 w-4" />Meus Pedidos</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/cliente/arquivos" className="gap-2"><FileText className="h-4 w-4" />Meus Arquivos</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/cliente/perfil" className="gap-2"><UserCircle className="h-4 w-4" />Meu Perfil</Link></DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link to="/admin" className="gap-2 text-primary"><ShieldCheck className="h-4 w-4" />Painel Admin</Link></DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="hidden md:block">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" /> Entrar
              </Button>
            </Link>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-6 pb-4 border-b border-border">
                <SheetTitle className="text-left">
                  {(logoMobile || logoUrl) ? (
                    <img src={logoMobile || logoUrl} alt="StartMídia" className="h-8 w-auto" />
                  ) : (
                    <span className="font-display text-xl text-primary">STARTMÍDIA</span>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="p-4 space-y-1">
                {/* Mobile search */}
                <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="mb-4">
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="h-9"
                  />
                </form>

                {navLinks.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center h-10 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}

                <div className="my-3 h-px bg-border" />

                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                    <Link to="/cliente/pedidos" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 h-10 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Package className="h-4 w-4" /> Meus Pedidos
                    </Link>
                    <Link to="/cliente/arquivos" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 h-10 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">
                      <FileText className="h-4 w-4" /> Meus Arquivos
                    </Link>
                    <Link to="/cliente/perfil" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 h-10 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted">
                      <UserCircle className="h-4 w-4" /> Meu Perfil
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 h-10 px-3 rounded-md text-sm text-primary hover:bg-primary/10">
                        <ShieldCheck className="h-4 w-4" /> Painel Admin
                      </Link>
                    )}
                    <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-2 h-10 px-3 rounded-md text-sm text-destructive hover:bg-destructive/10 w-full">
                      <LogOut className="h-4 w-4" /> Sair
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 h-10 px-3 rounded-md text-sm text-primary font-medium hover:bg-primary/10">
                    <User className="h-4 w-4" /> Entrar / Cadastrar
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
