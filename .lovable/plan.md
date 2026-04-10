

# Fix: Salvar product_snapshot nos order_items

## Problema
`product_snapshot` não é preenchido ao criar pedido, fazendo com que fotos e dados dos itens desapareçam quando o produto original é editado/removido.

## Alteração

### `src/pages/Checkout.tsx` — bloco `orderItems` dentro de `handleCreateOrder` (~linhas 95-105)
- Adicionar campo `product_snapshot` com `thumbnail`, `priceUnit`, `needsArtwork`, `unitPrice`
- Adicionar `custom_width: item.customWidth || null` e `custom_height: item.customHeight || null` (com fallback null)
- Definir `artwork_status` como `'pending'` se `needsArtwork`, senão `'not_required'`

Nenhuma outra alteração necessária.

