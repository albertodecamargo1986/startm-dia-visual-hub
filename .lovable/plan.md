

# Seção 5 — Portfolio / Galeria de Trabalhos na Home

## Resumo
Adicionar uma nova seção `PortfolioPreviewSection` ao `src/pages/Index.tsx`, entre `DifferentialsSection` e o final da página. Usa CSS columns para masonry grid com overlay no hover e botão para ver portfolio completo.

## Alterações

### `src/pages/Index.tsx`
- Adicionar componente `PortfolioPreviewSection` com:
  - Título: "Confira Nossos **Trabalhos**" (span com text-primary)
  - Array estático de ~8 trabalhos (título, categoria, aspect ratio variado) — placeholder com bg-muted e texto até haver imagens reais
  - CSS `columns-2 md:columns-3 lg:columns-4 gap-4` para masonry layout
  - Cada item: `break-inside-avoid mb-4`, aspect ratio variado (video, square, 4/3)
  - Hover: overlay escuro absoluto com `opacity-0 group-hover:opacity-100 transition-opacity` mostrando nome do trabalho e categoria
  - Animação `framer-motion` com `whileInView` staggered
  - Botão "Ver Portfolio Completo" → `/portfolio` no final da seção
- Inserir `<PortfolioPreviewSection />` após `<DifferentialsSection />` no componente `Index`

