import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const EmailVerified = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          navigate('/cliente', { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Conta Verificada | StartMídia</title>
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
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
            </motion.div>
            <CardTitle className="font-display text-2xl">Conta Verificada!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bem-vindo à StartMídia! Sua conta foi ativada com sucesso.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando em {countdown}s...
            </p>
            <Button
              onClick={() => navigate('/cliente', { replace: true })}
              className="w-full font-display text-lg tracking-wider"
            >
              Acessar Minha Conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EmailVerified;
