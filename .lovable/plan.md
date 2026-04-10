

# Hardening do Webhook PagSeguro — ✅ Concluído

## Implementado
- Tabela `payment_webhook_events` com UNIQUE constraint para idempotência
- Validação de origem via API PagSeguro
- Proteção contra rebaixamento de status (hierarquia pending < paid < refunded)
- Logs estruturados em JSON

---

# Automação de Notificações de Pedido — ✅ Concluído

## Implementado
- Tabela `notifications_queue` com retry exponencial (5 tentativas, backoff 2^n * 30s)
- Trigger SQL `enqueue_order_notification` na tabela `orders` (UPDATE de status)
- Trigger SQL `enqueue_new_order_notification` na tabela `orders` (INSERT)
- Edge Function `process-notifications` com batch processing (10/vez)
- Cron job a cada minuto para processar fila
- 6 templates React Email preparados:
  - `pedido-criado` (cliente + admin)
  - `pagamento-confirmado` (cliente)
  - `aguardando-arte` (cliente)
  - `arte-aprovada` (cliente)
  - `pedido-enviado` (cliente)
  - `pedido-cancelado` (cliente + admin)

## Pendente: Configuração de Email
- A infraestrutura de email (Lovable Emails) precisa ser configurada com um domínio verificado
- Enquanto isso, as notificações são enfileiradas mas o envio falhará (com retry)
- Assim que o domínio estiver verificado e `send-transactional-email` estiver disponível, os emails começam automaticamente

---

# Limpeza de Arquivos Órfãos no Storage — ✅ Concluído

## Implementado
- Tabela `cleanup_reports` para relatórios auditáveis
- Edge Function `cleanup-orphan-files` com modos dry_run e apply
- Verifica buckets `customer-files` e `artwork-files`
- Identifica arquivos sem referência ou de pedidos cancelados há mais de X dias
- Cron job semanal (domingos 3h) em modo dry_run
- Relatório salvo na tabela para consulta admin
