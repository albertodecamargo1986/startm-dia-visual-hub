

# Sitemap Dinâmico e Canonical por Rota

## Plano

### 1. Edge Function `generate-sitemap`

Criar `supabase/functions/generate-sitemap/index.ts` que:
- Consulta `products` (ativos) e `categories` (ativas) no banco
- Gera XML do sitemap com todas as rotas públicas:
  - `/` (priority 1.0)
  - `/produtos` (0.9)
  - `/produtos/{categorySlug}` para cada categoria (0.8)
  - `/produto/{productSlug}` para cada produto (0.7)
  - `/sobre`, `/portfolio`, `/contato`, `/privacidade` (0.6-0.7)
- Exclui rotas privadas (admin, cliente, checkout, login)
- Retorna `Content-Type: application/xml`
- Sem autenticação (público)

### 2. Atualizar `robots.txt`

Mudar a linha do Sitemap para apontar para a Edge Function:
```
Sitemap: https://wzdxseimfqarknttabbu.supabase.co/functions/v1/generate-sitemap
```

### 3. Canonical nas Páginas Dinâmicas

Adicionar `<link rel="canonical">` via `react-helmet-async` em:
- `ProductDetail.tsx` → `https://startmidialimeira.com.br/produto/{slug}`
- `Shop.tsx` → `https://startmidialimeira.com.br/produtos` ou `.../produtos/{categorySlug}`
- Páginas estáticas (Index, About, Portfolio, Contact) → canonical fixo

Atualizar o componente `SEO.tsx` para sempre renderizar o canonical quando fornecido (já suporta a prop).

### 4. Remover `public/sitemap.xml` Estático

O arquivo estático será substituído pela edge function dinâmica.

## Arquivos

| Arquivo | Alteração |
|---|---|
| `supabase/functions/generate-sitemap/index.ts` | Nova edge function |
| `public/robots.txt` | Atualizar URL do sitemap |
| `public/sitemap.xml` | Remover |
| `src/pages/ProductDetail.tsx` | Adicionar canonical |
| `src/pages/Shop.tsx` | Adicionar canonical |
| `src/pages/Index.tsx` | Adicionar canonical |
| `src/pages/About.tsx` | Adicionar canonical |
| `src/pages/Portfolio.tsx` | Adicionar canonical |
| `src/pages/Contact.tsx` | Adicionar canonical |

