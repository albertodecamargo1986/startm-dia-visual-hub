

# Seção 6 — Depoimentos (Carrossel)

## Resumo
Adicionar `TestimonialsSection` ao `src/pages/Index.tsx` após `PortfolioPreviewSection`. Carrossel Embla com cards de depoimento contendo foto circular, nome, empresa, texto e estrelas.

## Alterações

### `src/pages/Index.tsx`
- Adicionar array estático de ~5 depoimentos com: nome, empresa, texto, estrelas (1-5), iniciais para avatar fallback
- Criar componente `TestimonialsSection`:
  - Título: "O que nossos **clientes** dizem" (span text-primary)
  - Carrossel Embla horizontal com cards de depoimento
  - Cada card: Avatar circular (iniciais com AvatarFallback), estrelas amarelas (Star icon filled), texto em itálico, nome em bold, empresa em muted
  - Setas de navegação e dots indicadores
  - Animação framer-motion whileInView
- Inserir `<TestimonialsSection />` após `<PortfolioPreviewSection />` no Index
- Importar `Star` de lucide-react e `Avatar`/`AvatarFallback` de shadcn

