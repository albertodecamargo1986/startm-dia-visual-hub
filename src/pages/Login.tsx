import { useState } from 'react';
import type { LoginLocationState } from '@/types';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(1, 'Nome é obrigatório').max(100),
  email: z.string().trim().email('Email inválido'),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  cpfCnpj: z.string().trim().max(18).optional(),
  companyName: z.string().trim().max(100).optional(),
}).refine(d => d.password === d.confirmPassword, { message: 'Senhas não conferem', path: ['confirmPassword'] });

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LoginLocationState | null)?.from?.pathname || '/cliente';

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', cpfCnpj: '', companyName: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(loginForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password });
    if (error) toast.error(error.message);
    else navigate(from, { replace: true });
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(signupForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        data: { full_name: signupForm.fullName, phone: signupForm.phone, cpf_cnpj: signupForm.cpfCnpj, company_name: signupForm.companyName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setLoading(false);
    navigate('/verificar-email', { state: { email: signupForm.email } });
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { toast.error('Informe o email.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
    setLoading(false);
    setShowForgot(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error('Erro ao entrar com Google.');
    }
    if (result.redirected) return;
    navigate(from, { replace: true });
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login | StartMídia Comunicação Visual</title>
        <meta name="description" content="Faça login ou crie sua conta na StartMídia para acompanhar pedidos e solicitar orçamentos." />
      </Helmet>

      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-3xl text-center">Minha Conta</CardTitle>
          </CardHeader>
          <CardContent>
            {showForgot ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Informe seu email para receber o link de recuperação:</p>
                <Input type="email" placeholder="Seu email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                <Button onClick={handleForgotPassword} disabled={loading} className="w-full">
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
                <button onClick={() => setShowForgot(false)} className="text-sm text-primary hover:underline w-full text-center block">
                  Voltar ao login
                </button>
              </div>
            ) : (
              <>
                <Button variant="outline" className="w-full mb-4" onClick={handleGoogleLogin} disabled={loading}>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Entrar com Google
                </Button>

                <div className="flex items-center gap-3 mb-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <Separator className="flex-1" />
                </div>

                <Tabs defaultValue="login">
                  <TabsList className="w-full">
                    <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
                    <TabsTrigger value="signup" className="flex-1">Criar Conta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                      <div>
                        <Input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Input type="password" placeholder="Senha" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                      </div>
                      <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-primary hover:underline">
                        Esqueci minha senha
                      </button>
                      <Button type="submit" disabled={loading} className="w-full font-display text-lg tracking-wider">
                        {loading ? 'Aguarde...' : 'Entrar'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-3 mt-4">
                      <div>
                        <Input placeholder="Nome completo *" value={signupForm.fullName} onChange={e => setSignupForm(p => ({ ...p, fullName: e.target.value }))} />
                        {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                      </div>
                      <div>
                        <Input type="email" placeholder="Email *" value={signupForm.email} onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))} />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <Input placeholder="Telefone / WhatsApp" value={signupForm.phone} onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} />
                      <div>
                        <Input type="password" placeholder="Senha *" value={signupForm.password} onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} />
                        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                      </div>
                      <div>
                        <Input type="password" placeholder="Confirmar senha *" value={signupForm.confirmPassword} onChange={e => setSignupForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                        {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                      </div>
                      <Input placeholder="CPF/CNPJ (opcional)" value={signupForm.cpfCnpj} onChange={e => setSignupForm(p => ({ ...p, cpfCnpj: e.target.value }))} />
                      <Input placeholder="Nome da empresa (opcional)" value={signupForm.companyName} onChange={e => setSignupForm(p => ({ ...p, companyName: e.target.value }))} />
                      <Button type="submit" disabled={loading} className="w-full font-display text-lg tracking-wider">
                        {loading ? 'Aguarde...' : 'Criar Conta'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Login;
