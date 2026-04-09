

# StartMídia — Plataforma E-commerce de Comunicação Visual

## Visão Geral
Plataforma completa para a StartMídia de Limeira/SP: loja virtual de produtos gráficos, área do cliente, painel administrativo, carrinho, checkout e gestão de pedidos/arquivos.

## 1. Fundação e Banco de Dados

### Identidade Visual
- Paleta dark com vermelho vibrante (#E63946), azul escuro (#1D3557), laranja (#F4A261)
- Fontes: Inter (corpo) + Bebas Neue (títulos) via Google Fonts
- Tema completo configurado no Tailwind/CSS variables

### Schema do Banco (Migrations)
- **user_roles** — tabela separada para roles (admin, super_admin, customer) com função `has_role()` SECURITY DEFINER para evitar recursão infinita nas RLS policies
- **profiles** — dados do usuário (sem coluna role, vinculada via user_roles)
- **categories** — 7 categorias pré-inseridas (Adesivos, Banners, Placas, etc.)
- **products** — produtos com preço base, variações de tamanho, tags, imagens
- **banners** — carrossel da home
- **orders** — pedidos com status completo (8 estados)
- **order_items** — itens com dimensões customizadas e arte
- **customer_files** — arquivos enviados pelos clientes
- **order_timeline** — histórico de status dos pedidos
- **site_settings** — configurações editáveis (WhatsApp, contatos, redes sociais)
- Trigger `handle_new_user()` para auto-criação de profile
- Função `generate_order_number()` com sequência (SM-2024-0001)
- 4 Storage buckets: product-images, banners (públicos), customer-files, artwork-files (privados)

## 2. Providers e Infraestrutura Frontend
- **AuthProvider** — gerencia sessão Supabase com `onAuthStateChange`
- **CartProvider** — estado do carrinho com localStorage
- **SettingsProvider** — carrega site_settings do banco via react-query

## 3. Páginas Públicas

### Home (/)
- Hero com carrossel de banners (embla-carousel)
- Seção de categorias com ícones Lucide
- Produtos em destaque (featured=true)
- Seção sobre a empresa + CTA WhatsApp
- Botão flutuante WhatsApp

### Loja (/produtos, /produtos/:categorySlug)
- Grid de produtos com filtros por categoria
- Cards com thumbnail, nome, preço base, tags
- Animações com framer-motion

### Detalhe do Produto (/produto/:productSlug)
- Galeria de imagens
- Seleção de quantidade e dimensões customizadas
- Informação de prazo de produção
- Botão "Adicionar ao carrinho" e "Solicitar orçamento via WhatsApp"

### Carrinho (/carrinho)
- Lista de itens com edição de quantidade
- Resumo com subtotal, frete e total
- Botão para checkout

### Sobre, Portfólio, Contato
- Páginas institucionais com informações da empresa
- Formulário de contato/orçamento com validação Zod

### Login (/login)
- Login/Cadastro com email+senha via Supabase Auth
- Campo de nome completo no cadastro

## 4. Área do Cliente (autenticada)

### Dashboard (/cliente)
- Resumo: pedidos recentes, status dos arquivos
- Links rápidos para pedidos e perfil

### Pedidos (/cliente/pedidos, /cliente/pedidos/:id)
- Lista de pedidos com status visual (badges coloridos)
- Detalhe com timeline de status, itens e upload de arte

### Arquivos (/cliente/arquivos)
- Upload e gerenciamento de artes
- Status de aprovação (pending, approved, rejected)

### Perfil (/cliente/perfil)
- Edição de dados pessoais, telefone, CPF/CNPJ

## 5. Checkout (autenticado)

- Formulário de endereço de entrega
- Seleção de método de pagamento
- Resumo do pedido
- Página de sucesso pós-compra

## 6. Painel Admin (admin/super_admin)

### Dashboard (/admin)
- Métricas: pedidos recentes, faturamento, clientes

### Gestão de Pedidos (/admin/pedidos)
- Tabela com filtros por status
- Detalhe com alteração de status, notas internas, timeline

### Gestão de Produtos (/admin/produtos)
- CRUD completo com upload de imagens
- Editor com todos os campos (preço, dimensões, prazo, tags)

### Gestão de Categorias, Banners, Clientes, Arquivos, Configurações
- CRUDs completos para cada entidade
- Configurações do site editáveis (WhatsApp, contatos, redes sociais)

## 7. Componentes Compartilhados
- Layout com header (logo, nav, carrinho, login) e footer (contatos, redes sociais)
- WhatsApp floating button
- Loading skeletons
- Guards de rota (autenticação e role admin)
- Toasts com Sonner para feedback

