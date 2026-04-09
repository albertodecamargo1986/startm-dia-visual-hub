

# Seção 7 — CTA Final

## Resumo
Adicionar `CTASection` ao `src/pages/Index.tsx` após `TestimonialsSection`. Banner full-width com fundo primary, texto chamativo e dois botões.

## Alterações

### `src/pages/Index.tsx`
- Criar componente `CTASection`:
  - Fundo `bg-primary` full-width, `py-20`
  - Título em branco: "Pronto para dar vida à sua ideia?" (font-display, text-3xl md:text-5xl)
  - Subtítulo: "Solicite seu orçamento agora mesmo. Atendimento rápido e personalizado."
  - Dois botões lado a lado:
    - **WhatsApp**: fundo branco, texto primary, ícone mensagem → abre wa.me com número das settings
    - **Ver Produtos**: outline branco → `/produtos`
  - Animação framer-motion `whileInView` fade-in
- Inserir `<CTASection />` após `<TestimonialsSection />` no Index
- Usar `useSettings` para pegar número WhatsApp dinamicamente

