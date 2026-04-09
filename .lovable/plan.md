

# Home Page com SEO e Carrossel — StartMídia

## Resumo
Reescrever `src/pages/Index.tsx` com SEO completo via `react-helmet-async`, hero carrossel full-screen com autoplay, categorias animadas, produtos em destaque em carrossel, e seção de diferenciais expandida (6 cards).

## Dependências a instalar
- `react-helmet-async` — meta tags SEO
- `embla-carousel-autoplay` — autoplay para o carrossel

## Arquivos a modificar

### 1. `src/main.tsx` — Wrap com HelmetProvider
Adicionar `<HelmetProvider>` envolvendo o app.

### 2. `index.html` — Atualizar meta tags padrão
Atualizar `<title>`, `og:title`, `og:description` e adicionar `<link rel="canonical">`.

### 3. `src/pages/Index.tsx` — Reescrever completo

**SEO**: `<Helmet>` com title, description, keywords, og tags e canonical.

**Seção 1 — Hero Carrossel**:
- `min-h-[600px]` ou `h-screen` com imagem de fundo full-width
- Embla carousel com `loop: true` + autoplay plugin (5s delay)
- Setas de navegação laterais (ChevronLeft/ChevronRight)
- Dots indicadores na parte inferior
- Fallback slide quando não há banners no banco
- Cada slide: título em Bebas Neue, subtítulo, botão CTA + botão WhatsApp

**Seção 2 — Categorias**:
- Título SEO: `<h2>Nossos Produtos e Serviços</h2>`
- Grid 2 colunas mobile, 4 desktop
- `framer-motion` com `whileInView` e delay escalonado
- Hover: scale + shadow + primary background

**Seção 3 — Produtos em Destaque**:
- Título: "Produtos em Destaque"
- Carrossel horizontal com Embla (não grid estático)
- Cards com foto, nome, preço, botão "Ver Produto"

**Seção 4 — Diferenciais (6 cards)**:
- Grid 2x mobile, 3x desktop
- 6 itens: Qualidade Premium, Entrega Rápida, Melhor Preço, Arte Inclusa, Pedido Online, Atendimento Personalizado
- Ícones Lucide: Trophy, Zap, DollarSign, Palette, Package, Handshake
- Animação whileInView com delay escalonado

