

# Fix: Webhook PagSeguro — valor "analyzing" inválido no banco

## Problema
O webhook tenta gravar `payment_status = 'analyzing'` quando PagSeguro envia status 2 (análise), mas o banco tem CHECK constraint que só aceita `('pending','paid','failed','refunded')`. Isso causa erro silencioso e o pedido nunca atualiza.

## Alteração

### `supabase/functions/pagseguro-webhook/index.ts`
- Substituir o bloco de mapeamento de status (linhas ~47–58) para:
  - Status 2 (análise) → manter `pending` em vez de `analyzing`
  - Status 5 (disputa) → manter `pending`, apenas registrar na timeline
  - Status 3/4 (pago) → `paid` / `awaiting_artwork`
  - Status 6/7 (cancelado) → `refunded` / `cancelled`
- Adicionar flag `shouldUpdate` para só gravar no banco quando o status realmente muda (status 3, 4, 6 ou 7)
- Envolver o bloco de update + timeline dentro de `if (shouldUpdate)`
- Para status 2 e 5, apenas registrar na timeline sem alterar o pedido

