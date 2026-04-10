

# Backups e Recuperação Operacional

## Contexto

Lovable Cloud gerencia a infraestrutura de banco de dados (backups automáticos diários são nativos da plataforma). Não temos acesso a `pg_dump`, cron jobs de sistema, nem ao painel de infraestrutura. O que podemos fazer é criar **verificações automatizadas** e **documentação operacional** dentro do projeto.

## Plano

### 1. Edge Function `health-check` (verificação de integridade)

Nova função `supabase/functions/health-check/index.ts` que:
- Verifica conectividade com o banco (SELECT 1)
- Conta registros recentes em tabelas críticas (orders, profiles, products)
- Verifica que os buckets de storage estão acessíveis (list com limit 1)
- Compara contagens com thresholds mínimos (ex: products > 0)
- Retorna status `healthy` / `degraded` / `unhealthy` com detalhes
- Grava resultado em nova tabela `health_checks`

### 2. Tabela `health_checks`

Migration:
```sql
CREATE TABLE public.health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL, -- healthy, degraded, unhealthy
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Health: admin read"
  ON public.health_checks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role));
```

### 3. Cron job semanal para health-check

Usar `pg_cron` + `pg_net` para invocar a edge function automaticamente (1x/semana).

### 4. Página admin de status operacional

Criar `src/pages/admin/AdminBackups.tsx` com:
- Histórico de health checks (tabela com status e detalhes)
- Indicador visual do último status (verde/amarelo/vermelho)
- Link para a documentação de restore

Adicionar rota `/admin/operacional` no `AdminLayout` com ícone `Shield`.

### 5. Documentação de backup e restore

Criar `docs/backup-restore.md` com:
- Política de backup (DB automático pela plataforma, storage em buckets dedicados)
- Checklist de restore em staging (passo a passo)
- Plano de rollback para migrações
- Contatos e responsáveis

### 6. Alerta admin em falha

A edge function `health-check` enfileira notificação em `notifications_queue` quando status é `degraded` ou `unhealthy`, reutilizando o sistema de notificações existente.

## Arquivos

| Arquivo | Alteração |
|---|---|
| Migration SQL | Nova tabela `health_checks` + cron job |
| `supabase/functions/health-check/index.ts` | Nova — verificação de integridade |
| `src/pages/admin/AdminBackups.tsx` | Nova — painel de status operacional |
| `src/pages/admin/AdminLayout.tsx` | Adicionar link "Operacional" |
| `src/App.tsx` | Adicionar rota `/admin/operacional` |
| `docs/backup-restore.md` | Nova — documentação de backup/restore |

## Limitações

- Backups de banco são gerenciados automaticamente pela plataforma — não temos controle direto sobre agendamento ou retenção
- O health-check valida integridade funcional, não a existência física do backup
- Restore real requer acesso ao painel da plataforma

