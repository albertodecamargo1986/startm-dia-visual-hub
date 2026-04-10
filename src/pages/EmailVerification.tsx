import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as EmailVerificationLocationState | null)?.email;
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // Poll every 5s
  useEffect(() => {
    if (!email) return;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        navigate('/email-verificado', { replace: true });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  // Listen to auth state changes (instant detection when link clicked in same browser)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email_confirmed_at) {
        navigate('/email-verificado', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      toast.error('Erro ao reenviar email.');
    } else {
      toast.success('Email reenviado! Verifique sua caixa de entrada.');
      setCooldown(60);
    }
    setLoading(false);
  };

  if (!email) return null;

  return (
    <>
      <Helmet>
        <title>Verificar Email | StartMídia</title>
      </Helmet>

      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto mb-4"
            >
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="h-10 w-10 text-primary" />
              </div>
            </motion.div>
            <CardTitle className="font-display text-2xl">Verifique seu email</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Enviamos um link de verificação para{' '}
              <strong className="text-foreground">{email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada (e spam) e clique no link para ativar sua conta.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Aguardando verificação...
            </div>

            <Button
              variant="outline"
              onClick={handleResend}
              disabled={loading || cooldown > 0}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar email'}
            </Button>

            <button
              onClick={() => navigate('/login')}
              className="text-sm text-primary hover:underline"
            >
              Voltar ao login
            </button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EmailVerification;
