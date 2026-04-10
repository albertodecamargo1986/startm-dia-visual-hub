

# Job de Limpeza de Arquivos Órfãos no Storage

## Visão Geral

Criar uma Edge Function `cleanup-orphan-files` que identifica e remove arquivos sem referência válida nos buckets `customer-files` e `artwork-files`. A função opera em dois modos: **dry-run** (apenas relatório) e **apply** (remoção efetiva).

## Alterações

### 1. Migração SQL — Tabela `cleanup_reports`

```sql
CREATE TABLE public.cleanup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL, -- 'dry_run' | 'apply'
  bucket text NOT NULL,
  total_orphans int DEFAULT 0,
  bytes_freed bigint DEFAULT 0,
  errors int DEFAULT 0,
  details jsonb DEFAULT '[]'::jsonb, -- array of { path, reason, size, error? }
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cleanup_reports ENABLE ROW LEVEL SECURITY;
-- Admin-only read
CREATE POLICY "Cleanup reports: admin read" ON public.cleanup_reports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
```

### 2. Edge Function `cleanup-orphan-files`

Parâmetros (query string): `mode=dry_run|apply`, `days_threshold=30` (dias desde cancelamento).

Lógica:
1. Listar todos os arquivos nos buckets `customer-files` e `artwork-files` via Storage API (usando service role)
2. Para cada arquivo, verificar se existe referência em `customer_files.file_url`
3. Se referenciado, verificar se o pedido associado existe e não está cancelado há mais de X dias
4. Classificar como órfão se: sem referência OU pedido cancelado há mais de X dias
5. No modo `apply`: deletar o arquivo via Storage API
6. Registrar resultado na tabela `cleanup_reports`
7. Enfileirar notificação de resumo para admins na `notifications_queue`

### 3. Cron Job Semanal

Agendar execução semanal (domingos às 3h) em modo `dry_run` por padrão. Admin pode invocar manualmente em modo `apply`.

```sql
SELECT cron.schedule(
  'cleanup-orphan-files-weekly',
  '0 3 * * 0',
  $$ SELECT net.http_post(...) $$
);
```

### 4. Notificação para Admin

Após cada execução, inserir na `notifications_queue` um evento `cleanup_report` com resumo (total de órfãos, bytes, erros). Reutiliza a infraestrutura de notificações existente.

## Arquivos

| Arquivo | Alteração |
|---|---|
| Nova migração SQL | Tabela `cleanup_reports` + cron job |
| `supabase/functions/cleanup-orphan-files/index.ts` | Nova edge function |

## Critérios de Aceite
- Modo dry_run não deleta nenhum arquivo
- Relatório auditável salvo na tabela `cleanup_reports`
- Execução semanal automática configurada
- Admin recebe resumo via notificação

