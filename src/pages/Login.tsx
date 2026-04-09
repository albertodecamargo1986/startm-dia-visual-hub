import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (error) { toast.error(error.message); }
      else { toast.success('Cadastro realizado! Verifique seu email.'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); }
      else { navigate('/'); }
    }
    setLoading(false);
  };

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-3xl text-center">
            {isSignup ? 'Criar Conta' : 'Entrar'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Input placeholder="Nome completo" value={fullName} onChange={e => setFullName(e.target.value)} required />
            )}
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <Button type="submit" disabled={loading} className="w-full font-display text-lg tracking-wider">
              {loading ? 'Aguarde...' : isSignup ? 'Cadastrar' : 'Entrar'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignup ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button onClick={() => setIsSignup(!isSignup)} className="text-primary hover:underline">
              {isSignup ? 'Fazer login' : 'Cadastre-se'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
