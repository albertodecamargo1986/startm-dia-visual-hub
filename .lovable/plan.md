

# Paginas Institucionais e SEO

## Resumo
Reescrever 5 paginas: Sobre, Portfolio (com tabela no banco), Contato (com tabela contact_requests), Politica de Privacidade (nova), e Login (com tabs, campos extras, Google OAuth, esqueci senha). Adicionar rota /privacidade.

## Migration - Novas tabelas

### `portfolio_items`
- id, title, category, image_url, description, active, created_at

### `contact_requests`
- id, name, email, phone, product, message, file_url, created_at

RLS: portfolio_items public read, admin write. contact_requests: admin read all, authenticated insert.

## Arquivos a modificar

### 1. `src/pages/About.tsx` → Reescrever como `Sobre`
- Helmet SEO com titulo e meta description para Limeira/SP
- Hero com area de foto da empresa (placeholder) + titulo animado
- Secao "Nossa Historia": texto + 3 cards de numeros (Anos de experiencia, Clientes atendidos, Projetos realizados)
- Secao "Nossa Equipe": 2 cards com foto placeholder, nome (Alberto Camargo / Felipe Santos), cargo, telefone do `useSettings`
- Secao "Especialidades": grid detalhado de servicos com icones Lucide
- CTA final: botao "Solicite um Orcamento" → /contato

### 2. `src/pages/Portfolio.tsx` → Reescrever
- Helmet SEO
- Busca portfolio_items do banco via useQuery
- Filtros de categoria no topo (botoes/tabs)
- Masonry grid com CSS columns
- Hover overlay escuro com titulo e descricao
- Click abre Dialog fullscreen (lightbox) com navegacao por setas (ArrowLeft/ArrowRight)
- Fallback para dados estaticos se tabela vazia

### 3. `src/pages/Contact.tsx` → Reescrever como formulario de orcamento
- Helmet SEO local
- Formulario: nome, email, telefone, produto de interesse (Select com categorias do banco), descricao do projeto, upload opcional de arquivo (para bucket customer-files)
- Ao enviar: insere em contact_requests + abre WhatsApp com resumo
- Validacao com zod
- Lado direito: iframe Google Maps embed, endereco/horario do useSettings, botao WhatsApp grande

### 4. `src/pages/Privacy.tsx` → Criar (nova)
- Texto estatico LGPD completo em portugues
- Helmet SEO
- Rota /privacidade no App.tsx

### 5. `src/pages/Login.tsx` → Reescrever com tabs e campos extras
- Tabs shadcn: "Entrar" / "Criar Conta"
- Login: email, senha, link "Esqueci minha senha" (chama resetPasswordForEmail)
- Cadastro: nome, email, telefone, senha, confirmar senha, CPF/CNPJ (opcional), empresa (opcional)
- Botao Google OAuth usando lovable.auth.signInWithOAuth("google")
- Redirect para /cliente ou location state anterior apos login
- Usar Configure Social Auth tool para gerar modulo lovable

### 6. `src/App.tsx` → Adicionar rota /privacidade

## Detalhes tecnicos
- Lightbox no portfolio: Dialog fullscreen com imagem grande, botoes prev/next, teclas seta
- Upload no contato: supabase.storage.from('customer-files').upload()
- Google Maps embed: iframe com endereco de Limeira/SP
- Esqueci senha: supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })
- Nao precisa criar pagina /reset-password agora (pode ser feita depois)

