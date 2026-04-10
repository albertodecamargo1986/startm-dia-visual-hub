

# Fix: Upload de arquivo no Checkout — URL assinada + vínculo ao pedido

## Problema
`handleFileSelect` salva o `data.path` interno no banco. Como o bucket `artwork-files` é privado, esse path não funciona para download. Além disso, não vincula o arquivo ao `order_item` correspondente.

## Alteração

### `src/pages/Checkout.tsx` — Atualizar `handleFileSelect`
- Gerar nome de arquivo único com `itemId-timestamp.ext`
- Após upload, criar URL assinada de 1 ano via `createSignedUrl`
- Buscar o `order_item.id` correspondente pelo `product_name` e `order_id`
- Salvar `fileUrl` (URL assinada) em `customer_files` com `order_item_id`
- Atualizar `artwork_url` e `artwork_status` no `order_items`
- Adicionar `profile` à guard inicial (`if (!orderId || !user || !profile)`)

Apenas a função `handleFileSelect` será substituída — todo o resto do arquivo permanece igual.

