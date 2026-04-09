

# Loja: Listagem e Detalhe de Produto

## Resumo
Reescrever 3 páginas: listagem de produtos com filtros avançados, detalhe de produto completo com galeria/configurador/tabs, e carrinho aprimorado com observações e CEP.

## Arquivos a modificar

### 1. `src/pages/Shop.tsx` — Reescrever completamente
- **SEO**: Helmet com titulo dinamico por categoria
- **Sidebar desktop** (hidden mobile): categorias com contagem de produtos (query separada), slider de preço (Slider shadcn), toggle "Apenas destaque" (Switch)
- **Mobile**: Sheet/Drawer com os mesmos filtros, botão "Filtros" visível
- **Grid responsivo**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Ordenação**: Select com opções (relevante, menor preço, maior preço, mais novo)
- **Busca**: Input com debounce 300ms (useState + useEffect com setTimeout)
- **Cards**: foto, badge categoria, nome, "a partir de R$ X,XX", botões "Ver Produto" e "WhatsApp" (aparecem no hover com group-hover)
- **Hover**: `group-hover:scale-[1.02] group-hover:shadow-lg transition-all`
- **Filtros aplicados na query**: preço range, featured, categoria, busca por nome

### 2. `src/pages/ProductDetail.tsx` — Reescrever completamente
- **SEO**: Helmet com `{product.meta_title || product.name} | StartMídia Limeira/SP`
- **Galeria**: carrossel principal + thumbnails clicáveis + zoom CSS no hover (`hover:scale-150 origin-center overflow-hidden`)
- **Breadcrumb**: Home > Categoria > Produto
- **Preço**: "a partir de R$ X,XX / m²" formatado
- **Configurador de tamanho** (se `has_custom_size`): inputs largura/altura em cm, cálculo de área em m² e subtotal dinâmico
- **Badge "Precisa de arte"** se `needs_artwork`
- **Quantidade**: input numérico com `min=min_quantity`
- **Textarea "Observações"**
- **Botão principal**: "Adicionar ao Carrinho" (vermelho, grande)
- **Botão secundário**: "Orçamento pelo WhatsApp"
- **Botão "Guia de Medidas"**: abre Dialog com explicação, tabela de tamanhos, dicas de resolução, formatos aceitos
- **Tabs abaixo**: Descrição | Especificações | Como enviar arte (usando Tabs shadcn)
- **Produtos relacionados**: query mesma categoria, excluindo produto atual, carrossel horizontal

### 3. `src/pages/CartPage.tsx` — Aprimorar
- **Items**: foto, nome, dimensões, preço unitário, controles +/-, botão remover com confirmação (AlertDialog), textarea "Observações do item"
- **Resumo lateral**: subtotal, campo CEP com botão calcular (placeholder por enquanto), total
- **Botão "Finalizar Compra"**: redireciona `/login` se não autenticado, senão `/checkout`
- **Botão "Continuar Comprando"** → `/produtos`
- Usar `item.id` (não `productId`) para updateQuantity/removeItem (corrigir bug atual)

### 4. `src/contexts/CartContext.tsx` — Adicionar campo `notes`
- Adicionar `notes` ao `addItem` e `updateQuantity`
- Criar `updateItemNotes(id, notes)` method

### 5. `src/App.tsx` — Sem mudanças (rotas já existem)

## Detalhes técnicos
- Debounce de busca: `useEffect` com `setTimeout` de 300ms e cleanup
- Contagem por categoria: query `products` agrupada ou contagem client-side
- Slider de preço: componente `Slider` do shadcn com min/max
- Zoom na galeria: `overflow-hidden` no container + `hover:scale-150` na imagem
- Produtos relacionados: query `products` com `category_id` igual e `id` diferente, limit 8
- CEP placeholder: input + botão, mostra "Em breve" por enquanto
- Confirmação de remoção: `AlertDialog` do shadcn

