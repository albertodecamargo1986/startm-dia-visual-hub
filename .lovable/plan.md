

# Área do Cliente — Reescrita Completa

## Resumo
Reescrever todas as 6 páginas da área do cliente com funcionalidades avançadas: layout com avatar e botão sair, dashboard com métricas detalhadas, pedidos com tabela completa, detalhe com timeline vertical e upload de arte, arquivos com download/re-upload, e perfil com avatar upload e reset de senha.

## Arquivos a modificar

### 1. `src/pages/client/ClientLayout.tsx` — Reescrever
- Avatar circular (iniciais ou foto) + nome do cliente no topo da sidebar
- Links: Dashboard, Meus Pedidos, Meus Arquivos, Meu Perfil
- Botão "Sair" com ícone LogOut na parte inferior da sidebar
- Mobile: tabs horizontais em vez de sidebar (usando flex row com scroll)
- Chamar `logout()` do AuthContext no botão sair

### 2. `src/pages/client/ClientDashboard.tsx` — Reescrever
- 4 cards de resumo: Total de pedidos, Pedidos em produção (status `in_production`), Arquivos pendentes (status `pending`), Último pedido (mini card com número e status)
- Grid `grid-cols-2 lg:grid-cols-4`
- Seção "Últimos Pedidos" com os 3 pedidos mais recentes em lista com status badge colorido e link para detalhe

### 3. `src/pages/client/ClientOrders.tsx` — Reescrever
- Tabela responsiva (Table do shadcn) com colunas: Número, Data, Total, Status (Badge colorido), Ação (botão "Ver Detalhes")
- Mobile: cards em vez de tabela (media query)
- Status badges usando `ORDER_STATUS_LABELS` e `ORDER_STATUS_COLORS` existentes

### 4. `src/pages/client/ClientOrderDetail.tsx` — Reescrever completamente
- Breadcrumb: Meus Pedidos > Pedido SM-YYYY-XXXX
- Header: número do pedido + badge de status grande
- **Timeline vertical**: linha vertical com círculos coloridos, ícone por etapa, data/hora, mensagem
- **Itens do pedido**: foto (thumbnail do product_snapshot), nome, quantidade, dimensões (se custom), preço
- **Seção de arte por item**:
  - `artwork_status = 'pending'`: badge amarelo "Aguardando Aprovação"
  - `artwork_status = 'approved'`: badge verde "Arte Aprovada"
  - `artwork_status = 'rejected'`: badge vermelho + `admin_comment` do `customer_files` + botão novo upload
  - `artwork_status = 'not_required'` ou item sem `needs_artwork`: badge cinza
  - Se sem arte enviada e item precisa: área de drag-and-drop upload
- **Upload de arte**: upload para `artwork-files/{userId}/{orderId}/`, insere em `customer_files`, atualiza `order_items.artwork_url` e `artwork_status`
- Resumo financeiro: subtotal, frete, total
- Dados de entrega (do `shipping_address` JSON)
- Invalidar queries após upload

### 5. `src/pages/client/ClientFiles.tsx` — Reescrever
- Lista com: nome, tamanho formatado (KB/MB), data de upload, pedido vinculado (link para `/cliente/pedidos/:id` via `order_item_id` → buscar `order_id`), status badge com labels PT-BR (Pendente/Aprovado/Rejeitado/Em revisão)
- Comentário do admin visível se rejeitado (`admin_comment`)
- Botão download (gera URL assinada do bucket `artwork-files`)
- Botão "Enviar novamente" se rejeitado

### 6. `src/pages/client/ClientProfile.tsx` — Reescrever
- **Avatar upload**: área circular clicável, upload para bucket `customer-files/{userId}/avatar`, salva URL em `profiles.avatar_url`
- Campos: nome, email (readonly), telefone, CPF/CNPJ, empresa
- **Endereço padrão**: CEP com autocomplete ViaCEP, rua, número, complemento, bairro, cidade, estado (salvar como JSON em profile ou campos separados — usar campos no form e salvar via `updateProfile`)
- Seção "Segurança": botão "Alterar Senha" que chama `supabase.auth.resetPasswordForEmail(profile.email)` e mostra toast
- Toast de confirmação ao salvar

## Detalhes técnicos
- Avatar: `Avatar` + `AvatarImage` + `AvatarFallback` do shadcn com iniciais
- Timeline: CSS com `border-l-2` e círculos absolutamente posicionados
- Upload drag-and-drop: `onDragOver`/`onDrop` handlers nativos + input file hidden
- Download: `supabase.storage.from('artwork-files').createSignedUrl(path, 3600)` para bucket privado
- Endereço padrão: como a tabela `profiles` não tem campos de endereço, salvar em `site_settings` ou usar `shipping_address` como JSON — melhor adicionar coluna `default_address jsonb` na tabela `profiles` via migration
- Reset senha: `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`

## Migration necessária
- Adicionar coluna `default_address jsonb default '{}'` à tabela `profiles` para endereço padrão

## Sem mudanças em
- `src/App.tsx` — rotas já existem
- `src/types/index.ts` — tipos já mapeados
- `src/contexts/AuthContext.tsx` — já tem `updateProfile` e `logout`

