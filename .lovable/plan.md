

# Vínculo robusto de arquivos por `order_item.id`

## Problema
Linha 191 de `Checkout.tsx` busca `order_item` por `product_name`, que falha com produtos duplicados no carrinho.

## Solução

### 1. Alterar RPC `create_order_transactional` (migração SQL)

Modificar a função para retornar, além de `order_id` e `order_number`, um array `items` com `{ cart_index, order_item_id }` para cada item inserido. Isso permite o frontend mapear cart item → order item de forma determinística.

```sql
-- No loop de inserção, coletar os IDs gerados
-- Retornar: { order_id, order_number, items: [{ cart_index: 0, order_item_id: "uuid" }, ...] }
```

### 2. Atualizar `Checkout.tsx`

- Após o RPC, construir um mapa `cartItemId → orderItemId` usando o índice do array de items (a ordem do array de itens no payload corresponde à ordem do array de itens no carrinho).
- Em `handleFileSelect`, usar diretamente o `orderItemId` do mapa em vez de fazer query por `product_name`.
- Remover as linhas 187-193 (query por `product_name`).
- Armazenar o mapa em state: `const [itemIdMap, setItemIdMap] = useState<Record<string, string>>({})`.

### 3. Validação

- No upload, verificar se `orderItemId` existe no mapa antes de prosseguir.
- Se não existir, mostrar erro e não fazer upload.

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| Nova migração SQL | Altera `create_order_transactional` para retornar array de item IDs |
| `src/pages/Checkout.tsx` | Usa mapa de IDs em vez de query por `product_name` |

### Critérios de aceite
- Cada arquivo vinculado ao `order_item_id` correto, sem ambiguidade
- Zero queries por `product_name` no fluxo de upload
- Funciona com produtos duplicados no carrinho

