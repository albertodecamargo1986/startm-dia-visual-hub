
# Checklist Final — Análise e Correções Necessárias

## Status dos Itens

| # | Item | Status | Observação |
|---|------|--------|------------|
| 1 | Cadastro/login com profile automático | ✅ OK | Trigger `handle_new_user` cria profile + role `customer` |
| 2 | Carrinho persiste localStorage | ✅ OK | `CartContext` lê/salva em `startmidia_cart` |
| 3 | Checkout cria pedido e redireciona PagSeguro | ✅ OK | Edge function `create-pagseguro-payment` implementada |
| 4 | Webhook PagSeguro atualiza status | ✅ OK | Edge function `pagseguro-webhook` mapeia status e atualiza timeline |
| 5 | Cliente upload de arte | ✅ OK | `ClientOrderDetail` tem upload com progresso |
| 6 | Admin baixar arquivo do cliente | ✅ OK | `AdminOrderDetail.handleDownload` cria signed URL |
| 7 | Admin aprovar/rejeitar arte | ✅ OK | Mutations `approveArt` e `rejectArt` com dialog de motivo |
| 8 | Mudança status registra timeline | ✅ OK | `updateStatus` insere em `order_timeline` com mensagem |
| 9 | Carrossel banners na home | ✅ OK | Embla com autoplay, dados do banco |
| 10 | SEO: title/description únicos | ✅ OK | Helmet em todas as 8 páginas públicas |
| 11 | Schema.org LocalBusiness na home | ⚠️ FALTA | Componente `SEO.tsx` existe mas NÃO é importado na Index |
| 12 | WhatsApp float todas as páginas | ✅ OK | `PublicLayout` inclui `WhatsAppFloat` |
| 13 | Guia de medidas em qualquer produto | ⚠️ PARCIAL | ProductDetail tem dialog inline, mas não usa o componente `GuiaMedidas` reusável |
| 14 | /admin protegida por role | ✅ OK | `RequireAdmin` verifica `isAdmin` |
| 15 | /cliente protegida por auth | ✅ OK | `RequireAuth` verifica `user` |

## Correções a Implementar

### 1. Promover usuário admin
- Inserir role `admin` para `albertodecamargo@gmail.com` (user_id: `a426ed04-ffd1-4c09-bb9b-ff7dfd682d36`) na tabela `user_roles`

### 2. Adicionar Schema.org na Home
- Importar e usar o componente `SEO` na `Index.tsx` ou adicionar JSON-LD inline no Helmet existente

### 3. Usar componente GuiaMedidas no ProductDetail
- Substituir o dialog inline pelo componente `GuiaMedidas` reutilizável que tem conteúdo mais completo (formatos aceitos, resolução, cores CMYK, etc.)

### 4. Secrets PagSeguro (pendente do usuário)
- As secrets `PAGSEGURO_EMAIL`, `PAGSEGURO_TOKEN`, `PAGSEGURO_SANDBOX`, `SITE_URL` ainda precisam ser configuradas para o checkout funcionar de fato

## Resumo de alterações
- 1 insert no banco (user_roles)
- `src/pages/Index.tsx` — adicionar JSON-LD do LocalBusiness no Helmet
- `src/pages/ProductDetail.tsx` — importar e usar `GuiaMedidas` no lugar do dialog inline
