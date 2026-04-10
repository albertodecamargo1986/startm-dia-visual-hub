import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, RefreshCw, CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'sonner';

type HealthCheck = {
  id: string;
  status: string;
  details: Record<string, { ok: boolean; detail: string }>;
  created_at: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  healthy: { label: 'Saudável', color: 'bg-green-500', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
  degraded: { label: 'Degradado', color: 'bg-yellow-500', icon: <AlertTriangle className="h-5 w-5 text-yellow-500" /> },
  unhealthy: { label: 'Crítico', color: 'bg-red-500', icon: <XCircle className="h-5 w-5 text-red-500" /> },
};

const AdminBackups = () => {
  const [running, setRunning] = useState(false);

  const { data: checks, refetch, isLoading } = useQuery({
    queryKey: ['health-checks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_checks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as HealthCheck[];
    },
  });

  const runHealthCheck = async () => {
    setRunning(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/health-check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const result = await res.json();
      if (result.status === 'healthy') {
        toast.success('Sistema saudável ✓');
      } else {
        toast.warning(`Status: ${result.status}`);
      }
      refetch();
    } catch {
      toast.error('Erro ao executar health check');
    } finally {
      setRunning(false);
    }
  };

  const latest = checks?.[0];
  const latestStatus = latest ? statusConfig[latest.status] || statusConfig.unhealthy : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Status Operacional
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verificação de integridade do sistema e documentação de recuperação
          </p>
        </div>
        <Button onClick={runHealthCheck} disabled={running}>
          <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Verificando…' : 'Executar Verificação'}
        </Button>
      </div>

      {/* Current Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status Atual</CardTitle>
          </CardHeader>
          <CardContent>
            {latestStatus ? (
              <div className="flex items-center gap-2">
                {latestStatus.icon}
                <span className="text-lg font-semibold">{latestStatus.label}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">Nenhuma verificação</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Última Verificação</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-semibold">
              {latest ? format(new Date(latest.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documentação</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> Plano de Backup & Restore
            </a>
            <p className="text-xs text-muted-foreground mt-1">Consulte docs/backup-restore.md no repositório</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest check details */}
      {latest?.details && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes da Última Verificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(latest.details).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded-lg border">
                  {val.ok ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground truncate">{val.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Verificações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : !checks?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma verificação encontrada. Execute a primeira acima.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checks OK</TableHead>
                  <TableHead>Checks Falhos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((c) => {
                  const entries = Object.values(c.details || {});
                  const ok = entries.filter((e) => e.ok).length;
                  const fail = entries.filter((e) => !e.ok).length;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">
                        {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'healthy' ? 'default' : c.status === 'degraded' ? 'secondary' : 'destructive'}>
                          {statusConfig[c.status]?.label || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">{ok}</TableCell>
                      <TableCell className="text-red-600 font-medium">{fail}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Backup info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Política de Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Banco de dados:</strong> Backups automáticos diários gerenciados pela plataforma com retenção de 7 dias.</p>
          <p>• <strong>Storage:</strong> Arquivos em buckets dedicados (product-images, customer-files, artwork-files, banners).</p>
          <p>• <strong>Verificação:</strong> Health check semanal automático (cron) + execução manual sob demanda.</p>
          <p>• <strong>Alertas:</strong> Notificação automática ao admin em caso de status degradado ou crítico.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackups;
