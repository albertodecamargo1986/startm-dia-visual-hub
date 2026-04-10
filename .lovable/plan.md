

# Otimização da Home — Componentização + Performance

## Situação Atual

O `Index.tsx` tem 535 linhas com 7 seções já definidas como componentes internos (`HeroBanner`, `CategoriesSection`, `FeaturedProducts`, `DifferentialsSection`, `PortfolioPreviewSection`, `TestimonialsSection`, `CTASection`). As queries estão inline nos componentes. Não há lazy loading.

## Plano

### 1. Extrair seções para arquivos individuais

Mover cada componente para `src/components/home/`:

| Componente | Arquivo |
|---|---|
| `HeroBanner` | `src/components/home/HeroBanner.tsx` |
| `CategoriesSection` | `src/components/home/CategoriesSection.tsx` |
| `FeaturedProducts` | `src/components/home/FeaturedProducts.tsx` |
| `DifferentialsSection` | `src/components/home/DifferentialsSection.tsx` |
| `PortfolioPreviewSection` | `src/components/home/PortfolioPreviewSection.tsx` |
| `TestimonialsSection` | `src/components/home/TestimonialsSection.tsx` |
| `CTASection` | `src/components/home/CTASection.tsx` |

### 2. Extrair queries para hooks reutilizáveis

Criar `src/hooks/use-home-data.ts` com hooks:
- `useBanners()` — query de banners ativos
- `useCategories()` — query de categorias ativas
- `useFeaturedProducts()` — query de produtos em destaque

Esses hooks podem ser reutilizados em outras páginas (Shop, admin, etc.).

### 3. Lazy loading para seções abaixo do fold

Usar `React.lazy` + `Suspense` para carregar sob demanda:
- **Eager (above fold):** `HeroBanner`, `CategoriesSection`
- **Lazy:** `FeaturedProducts`, `DifferentialsSection`, `PortfolioPreviewSection`, `TestimonialsSection`, `CTASection`

### 4. Otimizações de imagens

- Confirmar `loading="lazy"` em todas as `<img>` (já presente em FeaturedProducts)
- Adicionar `loading="lazy"` nas imagens do hero banner (exceto o primeiro slide)
- Adicionar `decoding="async"` nas imagens de produto

### 5. Index.tsx final

Ficará com ~40 linhas: imports, Helmet/SEO, e composição dos componentes com Suspense.

## Arquivos

| Arquivo | Alteração |
|---|---|
| `src/components/home/*.tsx` (7 arquivos) | Novos — seções extraídas |
| `src/hooks/use-home-data.ts` | Novo — hooks de query |
| `src/pages/Index.tsx` | Refatorado — composição com lazy loading |

## Critérios
- Layout visual idêntico ao atual
- Index.tsx enxuto e legível
- Seções abaixo do fold carregam sob demanda

