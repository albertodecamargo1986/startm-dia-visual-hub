

# Painel Administrativo — Reescrita Completa

## Resumo
Reescrever todas as páginas do painel admin com funcionalidades avançadas: layout com sidebar escura, dashboard com KPIs e gráfico Recharts, gestão de pedidos com filtros/paginação/export CSV, detalhe de pedido com aprovação de arte, produto com tabs e upload de fotos, banners com reorder, categorias com edição inline, clientes com detalhes, arquivos com approve/reject, e configurações completas.

## Dependência a instalar
- `recharts` — gráfico de barras no dashboard

## Arquivos a modificar

### 1. `src/pages/admin/AdminLayout.tsx` — Reescrever
- Sidebar escura (`bg-gray-900`) com logo "StartMídia Admin", avatar do admin, menu com ícones Lucide
- Botão "Ver Site" abre `/` em nova aba
- Mobile: Sheet com menu hamburger
- Breadcrumb dinâmico no topo do conteúdo baseado na rota atual

### 2. `src/pages/admin/AdminDashboard.tsx` — Reescrever
- 5 cards KPI: Pedidos hoje, Receita do mês, Aguardando arte, Em produção, Total clientes
- Gráfico de barras Recharts: pedidos por dia nos últimos 7 dias (query agrupada por `created_at::date`)
- Lista "Pedidos que precisam de atenção": arte rejeitada, aguardando arte >24h, pagos não iniciados

### 3. `src/pages/admin/AdminOrders.tsx` — Reescrever
- Tabela completa (Table shadcn) com colunas: #Pedido, Cliente, Data, Total, Status Pgto, Status Produção, Ações
- Filtros: Select de status, DatePicker (ou inputs date) para range, Input busca
- Paginação (20/página) com botões Anterior/Próximo e contagem
- Botão "Exportar CSV" (gera e baixa CSV client-side)
- Select de mudança rápida de status na linha

### 4. `src/pages/admin/AdminOrderDetail.tsx` — Aprimorar
- Seção de arte por item: preview de imagem, botão download (URL assinada), botões Aprovar/Rejeitar arte
- Rejeitar abre Dialog com textarea para motivo → atualiza `customer_files.admin_comment` e `customer_files.status`
- Aprovar atualiza `order_items.artwork_status` e `customer_files.status`
- Campo "Notas Internas" (`admin_notes`) editável e salvo
- Campo "Data prevista de entrega" (`estimated_delivery`) editável
- Botão "WhatsApp" abre wa.me com número do cliente
- Mensagens automáticas por status no timeline

### 5. `src/pages/admin/AdminProducts.tsx` — Reescrever
- Tabela com thumbnail, nome, categoria, preço, toggle ativo, toggle destaque
- Filtros: categoria (Select), status, busca
- Botões: Editar, Duplicar (insere cópia), Arquivar (toggle active)
- Botão "+ Novo Produto"

### 6. `src/pages/admin/AdminProductForm.tsx` — Reescrever com Tabs
- **Tab "Informações Básicas"**: nome, slug (auto-gerado), categoria, descrição curta (160 chars com contador), preço, unidade, qtd mínima, prazo, switches (ativo, destaque, arte, tamanho)
- **Tab "Fotos"**: upload múltiplo para `product-images`, grade de previews, botão remover, estrela para thumbnail. Dialog "Ajuda" com guia de tamanhos
- **Tab "SEO"**: meta title (contador 60), meta description (contador 160), preview Google simulado, tags com chips
- **Tab "Descrição Completa"**: textarea markdown, seção "Como enviar arte", seção "Especificações"

### 7. `src/pages/admin/AdminBanners.tsx` — Reescrever
- Lista com preview, título, toggle ativo, botões editar/remover
- Dialog de criação/edição com upload de imagem, campos título/subtítulo/link/CTA, guia de tamanho (1920x600px)
- Toggle ativo/inativo

### 8. `src/pages/admin/AdminCategories.tsx` — Reescrever
- Lista com toggle ativo, setas para reordenar (up/down), edição inline de nome
- Dialog de criação: nome, slug, ícone (Select com opções de ícones Lucide), descrição

### 9. `src/pages/admin/AdminClients.tsx` — Reescrever
- Tabela: nome, email, telefone, total pedidos (count), total gasto (sum), data cadastro
- Click abre Dialog/expandir com lista de pedidos e arquivos do cliente

### 10. `src/pages/admin/AdminFiles.tsx` — Reescrever
- Tabela: cliente, pedido, arquivo, data, status, tamanho
- Filtros por status
- Botão Download (URL assinada)
- Botões Aprovar/Rejeitar (com Dialog para comentário)
- Preview inline para imagens (thumbnail clicável)

### 11. `src/pages/admin/AdminSettings.tsx` — Reescrever
- Seções agrupadas: Contato, Redes Sociais, PagSeguro
- Campos de PagSeguro com type="password"
- Toggle Sandbox/Produção
- Botão salvar

## Detalhes técnicos
- Recharts: `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`
- CSV export: construir string CSV client-side e usar `Blob` + `URL.createObjectURL` + anchor click
- Upload de fotos de produto: `supabase.storage.from('product-images').upload(path, file)` + `getPublicUrl`
- Aprovar arte: update `customer_files.status = 'approved'` + `order_items.artwork_status = 'approved'`
- Rejeitar arte: update `customer_files.status = 'rejected'`, `customer_files.admin_comment = motivo`, `order_items.artwork_status = 'rejected'`
- Paginação: `.range(from, to)` no Supabase query
- Mensagens automáticas de status: mapa de status → mensagem PT-BR inserido no `order_timeline`
- Breadcrumb: componente que parseia `pathname` e gera links

