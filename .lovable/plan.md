

# Automação de Notificações de Pedido

## Contexto

O projeto não tem domínio de email configurado. Sem isso, não é possível enviar emails via infraestrutura Lovable. A implementação precisa ser feita em duas partes: a fila de notificações (backend) e o envio de email (requer configuração de domínio pelo usuário).

## Plano

### 1. Migração SQL — Tabela `notifications_queue` + Trigger

Criar tabela para enfileirar notificações com suporte a retry:

```sql
CREATE TABLE public.notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  event_type text NOT NULL,  -- pedido_criado, pagamento_confirmado, etc.
  channel text NOT NULL DEFAULT 'email',
  recipient_type text NOT NULL, -- customer | admin
  recipient_email text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | sent | failed | skipped
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 5,
  next_retry_at timestamptz DEFAULT now(),
  last_error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
```

Criar trigger na tabela `orders` que enfileira notificações ao detectar mudança de `status`:

```sql
CREATE FUNCTION enqueue_order_notification() RETURNS trigger ...
-- Mapeia status → event_type
-- Insere 2 linhas: uma para customer, uma para admin
```

RLS: admins podem ler; a edge function usa service role.

### 2. Edge Function `process-notifications`

- Busca notificações `pending` onde `next_retry_at <= now()` em batch (10 por vez)
- Para cada notificação, tenta enviar email via `send-transactional-email`
- Em caso de falha: incrementa `attempts`, calcula `next_retry_at` com backoff exponencial (2^attempts * 30s)
- Se `attempts >= max_attempts`, marca como `failed`
- **Pré-requisito de email**: Enquanto o domínio de email não estiver configurado, a function registra o evento mas marca como `skipped` com motivo claro

### 3. Templates de Email (6 eventos)

Criar templates React Email em `_shared/transactional-email-templates/` para:
- `pedido-criado` (cliente + admin)
- `pagamento-confirmado` (cliente)
- `aguardando-arte` (cliente)
- `arte-aprovada` (cliente)
- `pedido-enviado` (cliente)
- `pedido-cancelado` (cliente + admin)

Cada template recebe variáveis: `customerName`, `orderNumber`, `status`, `orderLink`.

### 4. Integrar Trigger nos Pontos Existentes

O trigger SQL cobre mudanças feitas via `UPDATE orders SET status = ...`, que já ocorrem em:
- `AdminOrderDetail.tsx` (mudança manual de status)
- `AdminOrders.tsx` (quick status)
- `pagseguro-webhook` (pagamento confirmado/cancelado)
- `artwork-helpers.ts` (arte aprovada → em produção)

### 5. Estrutura para WhatsApp (futuro)

A coluna `channel` na tabela já suporta `'whatsapp'`. Quando implementar, basta adicionar lógica condicional na edge function.

## Pré-requisito: Domínio de Email

Antes de poder enviar os emails, é necessário configurar um domínio de email. Vou incluir o botão de configuração para que você possa fazer isso. A fila e os templates serão criados já preparados — assim que o domínio estiver verificado, os emails começam a ser enviados automaticamente.

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| Nova migração SQL | Tabela `notifications_queue`, trigger `enqueue_order_notification` |
| `supabase/functions/process-notifications/index.ts` | Nova edge function de processamento |
| `_shared/transactional-email-templates/*.tsx` | 6 templates de notificação |
| `_shared/transactional-email-templates/registry.ts` | Registro dos novos templates |

