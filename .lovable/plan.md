

# Hardening do Webhook PagSeguro — Assinatura + Idempotência

## Problema Atual
- Sem validação de origem (qualquer POST é aceito)
- Sem idempotência (mesmo evento pode processar múltiplas vezes)
- Pode rebaixar status `paid` → `pending` com notificações antigas
- Logs não estruturados

## Plano

### 1. Migração SQL — Tabela `payment_webhook_events`

```sql
CREATE TABLE public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'pagseguro',
  provider_event_id text NOT NULL,        -- notificationCode
  transaction_code text DEFAULT '',
  pg_status int,
  order_number text DEFAULT '',
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received', -- received | processed | skipped | error
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text DEFAULT '',
  UNIQUE(provider, provider_event_id)      -- idempotência
);
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Somente admins podem ler (para auditoria)
CREATE POLICY "Webhook events: admin read" ON public.payment_webhook_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
```

### 2. Reescrever `pagseguro-webhook/index.ts`

Fluxo atualizado:

1. **Validar origem**: O PagSeguro não envia assinatura HMAC. A validação oficial é feita consultando a API do PagSeguro com o `notificationCode` — se retornar XML válido com `<transaction>`, a notificação é legítima. Verificar que a resposta HTTP é 200 e contém `<code>`.

2. **Idempotência**: Antes de processar, tentar `INSERT` na tabela `payment_webhook_events` com `provider_event_id = notificationCode`. Se violar UNIQUE, o evento já foi processado → retornar 200 sem fazer nada.

3. **Proteção contra rebaixamento**: Buscar o pedido atual antes de atualizar. Se o `payment_status` atual já é `paid` e o novo status seria `pending`, ignorar (marcar evento como `skipped`).

4. **Ordem de status válida**: Definir hierarquia `pending < paid < refunded`. Só aceitar transições para frente (exceto `refunded` que é terminal).

5. **Log estruturado**: Usar `console.log(JSON.stringify({ ... }))` com campos padronizados (`event`, `notificationCode`, `transactionCode`, `orderNumber`, `pgStatus`, `action`).

6. **Respostas HTTP**: Sempre 200 para o PagSeguro (ele reenvia em caso de erro). Registrar erros internamente na tabela.

### 3. Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| Nova migração SQL | Cria `payment_webhook_events` com UNIQUE constraint |
| `supabase/functions/pagseguro-webhook/index.ts` | Idempotência, proteção contra rebaixamento, logs estruturados |

### Critérios de Aceite
- Evento duplicado → `skipped` na tabela, pedido inalterado
- Notificação inválida (XML sem `<code>`) → registrada como `error`
- Status `paid` nunca rebaixado para `pending`
- Toda decisão logada com contexto estruturado

