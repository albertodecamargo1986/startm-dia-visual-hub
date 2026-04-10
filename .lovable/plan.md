

# Checkout Transacional — RPC `create_order_transactional`

## Problema Atual
O checkout (linhas 99-140 de `Checkout.tsx`) faz 3 chamadas separadas ao banco:
1. `orders.insert` — cria o pedido
2. `order_items.insert` — cria os itens
3. `order_timeline.insert` — cria o evento inicial

Se qualquer chamada falhar após a primeira, ficam pedidos órfãos sem itens.

## Plano

### 1. Migração SQL — Criar RPC `create_order_transactional`

Função PL/pgSQL que recebe um payload JSONB e, numa única transação:
- Gera `order_number` via `generate_order_number()`
- Insere em `orders`
- Insere todos os `order_items` (loop no array do payload)
- Insere evento inicial em `order_timeline`
- Retorna `{ "order_id": ..., "order_number": ... }`

Validações dentro da função:
- `customer_id` obrigatório
- Array de itens não pode ser vazio
- Cada item deve ter `product_name`, `unit_price`, `quantity`, `total_price`

Qualquer erro causa rollback automático (transação única).

RLS: a função será `SECURITY DEFINER` com `search_path = public`, e validará internamente que o `customer_id` pertence ao `auth.uid()` chamador (via lookup em `profiles`).

### 2. Atualizar `Checkout.tsx`

Substituir as 3 chamadas (linhas 95-150) por uma única:

```typescript
const { data, error } = await supabase.rpc('create_order_transactional', {
  payload: {
    customer_id: profile.id,
    subtotal: total,
    total: total,
    shipping_address: { ... },
    notes,
    items: items.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      product_snapshot: { ... },
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
      custom_width: item.customWidth || null,
      custom_height: item.customHeight || null,
      notes: item.notes || '',
      artwork_status: item.needsArtwork ? 'pending' : 'not_required',
    })),
  }
});
```

Tratamento de erro: mensagem clara ao usuário com `toast.error` e log do erro para debug.

### 3. Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| Nova migração SQL | Cria `create_order_transactional(payload jsonb)` |
| `src/pages/Checkout.tsx` | Substitui 3 chamadas por `supabase.rpc(...)` |

### Critérios de Aceite
- Zero pedidos órfãos — tudo ou nada
- Frontend recebe `order_id` e `order_number` numa resposta única
- Erro em qualquer etapa retorna falha total com mensagem amigável
- Validação de payload no backend (campos obrigatórios, array não vazio)

