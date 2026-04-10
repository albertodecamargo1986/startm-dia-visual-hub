import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type ResetState = 'loading' | 'ready' | 'invalid' | 'success';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<ResetState>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    // Check for recovery event from the auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setState('ready');
      }
    });

    // Also check hash for type=recovery (fallback)
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setState('ready');
    }

    // Timeout: if no recovery event after 3s, mark invalid
    const timeout = setTimeout(() => {
      setState(prev => prev === 'loading' ? 'invalid' : prev);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = resetSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password: form.password });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    setState('success');
    setSubmitting(false);
    toast.success('Senha redefinida com sucesso!');
    setTimeout(() => navigate('/login', { replace: true }), 2500);
  };

  return (
    <>
      <Helmet>
        <title>Redefinir Senha | StartMídia</title>
        <meta name="description" content="Redefina sua senha de acesso à StartMídia." />
      </Helmet>

      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-center">Redefinir Senha</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Validando link de recuperação...</p>
              </div>
            )}

            {state === 'invalid' && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <XCircle className="h-12 w-12 text-destructive" />
                <h3 className="text-lg font-semibold text-foreground">Link inválido ou expirado</h3>
                <p className="text-sm text-muted-foreground">
                  O link de recuperação não é válido ou já expirou. Solicite um novo link na página de login.
                </p>
                <Button onClick={() => navigate('/login')} className="mt-4">
                  Voltar ao Login
                </Button>
              </div>
            )}

            {state === 'success' && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Senha redefinida!</h3>
                <p className="text-sm text-muted-foreground">
                  Sua senha foi alterada com sucesso. Redirecionando para o login...
                </p>
              </div>
            )}

            {state === 'ready' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Digite sua nova senha abaixo.
                </p>
                <div>
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={form.confirmPassword}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" disabled={submitting} className="w-full font-display text-lg tracking-wider">
                  {submitting ? 'Aguarde...' : 'Redefinir Senha'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ResetPassword;
