

# Admin — Gestão Completa de Portfólio + Conteúdo Editável do Site

## Resumo
Criar página de gestão de portfólio no admin e expandir as configurações para permitir edição de todo o conteúdo textual das páginas institucionais (Sobre, Contato, Privacidade, Home) diretamente pelo painel.

## O que falta hoje
1. **Portfólio**: não existe página admin para CRUD de `portfolio_items` — o admin não consegue adicionar/editar/remover itens
2. **Conteúdo das páginas**: textos da Home, Sobre, Contato e Privacidade estão hardcoded no código — o admin não consegue editar

## Alterações

### 1. `src/pages/admin/AdminPortfolio.tsx` — Criar
- Tabela listando todos os `portfolio_items` (título, categoria, ativo, ordem)
- Botão "Novo Item" abre dialog/formulário com:
  - Título, Categoria (select com categorias existentes + texto livre), Descrição
  - Upload de imagem via `ImageUploadWithEditor`
  - Ordem, Ativo (switch)
- Edição inline ou via dialog ao clicar em item existente
- Botão excluir com confirmação
- Reordenação por drag ou botões seta

### 2. `src/pages/admin/AdminPageEditor.tsx` — Criar
- Página com tabs para cada página editável: Sobre, Contato, Privacidade, Home
- Cada tab tem campos de texto (Textarea) mapeados a chaves no `site_settings`:
  - **Home**: `home_hero_title`, `home_hero_subtitle`, `home_testimonials` (JSON)
  - **Sobre**: `about_history`, `about_mission`, `about_stats` (JSON com label/value)
  - **Contato**: `contact_intro`, `contact_hours`
  - **Privacidade**: `privacy_content` (texto completo Markdown)
- Botão salvar faz upsert no `site_settings` para cada chave
- Preview simplificado ao lado do editor

### 3. `src/pages/admin/AdminLayout.tsx` — Atualizar
- Adicionar links no menu lateral:
  - 🎨 Portfólio (`/admin/portfolio`)
  - 📝 Páginas (`/admin/paginas`)
- Atualizar breadcrumbMap

### 4. `src/App.tsx` — Adicionar rotas
- `/admin/portfolio` → `AdminPortfolio`
- `/admin/paginas` → `AdminPageEditor`

### 5. Páginas públicas — Usar conteúdo dinâmico
- `About.tsx`: ler `about_history`, `about_mission`, `about_stats` do SettingsContext, fallback para texto atual
- `Privacy.tsx`: ler `privacy_content` do settings, renderizar como Markdown (ou HTML), fallback para texto atual
- `Index.tsx`: ler `home_hero_title`, `home_hero_subtitle` do settings, fallback para texto atual
- `Contact.tsx`: ler `contact_hours` do settings, fallback

## Detalhes técnicos
- Portfólio: CRUD direto na tabela `portfolio_items` que já existe com RLS configurada (admin write, public read active)
- Conteúdo editável: reutiliza tabela `site_settings` (key/value) — sem migration necessária
- Upload de imagens do portfólio: usa bucket `banners` (público) ou `product-images`
- Markdown para privacidade: usar `react-markdown` ou renderização simples com `white-space: pre-wrap`
- Nenhuma migration necessária — todas as tabelas já existem

