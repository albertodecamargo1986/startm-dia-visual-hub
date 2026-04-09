

# Upload de Imagens com Editor, Logo Dinâmica e Admin Seed

## Resumo
Adicionar um componente de upload de imagens com editor (corte e filtros) reutilizável em todo o site, permitir upload e troca da logo via painel admin, e criar o usuário admin inicial.

## 1. Criar hook `useImageUpload` e componente `ImageEditor`

### `src/hooks/use-image-upload.ts`
- Hook baseado no código fornecido, adaptado para o projeto (sem Next.js Image, usa `<img>` nativo)
- Retorna previewUrl, fileName, fileInputRef, handlers

### `src/components/ui/image-editor.tsx`
- Componente de editor de imagens com:
  - **Crop**: usar biblioteca `react-image-crop` para recorte livre e com proporções fixas (1:1, 16:9, 4:3, livre)
  - **Filtros CSS**: brightness, contrast, saturation, grayscale, sepia, blur — controlados por sliders
  - **Preview em tempo real** dos filtros aplicados
  - Botão "Usar Original" para pular edição
  - Botão "Aplicar" que gera o Blob final (usa canvas para aplicar crop + filtros)
- Abre como Dialog/modal quando o usuário seleciona uma imagem

### `src/components/ui/image-upload-with-editor.tsx`
- Componente completo reutilizável que combina:
  - Área de drag-and-drop + click para selecionar
  - Preview da imagem selecionada
  - Botão editar que abre o `ImageEditor`
  - Botão remover
  - Aceita props: `onImageReady(file: File)`, `currentUrl?`, `aspectRatio?`, `maxSizeMB?`

## 2. Dependência a instalar
- `react-image-crop` — biblioteca de crop de imagens

## 3. Integrar editor em todos os locais de upload

### Locais que precisam do editor:
1. **AdminProductForm.tsx** (Tab Fotos) — substituir upload simples pelo `ImageUploadWithEditor`
2. **AdminBanners.tsx** (Dialog de banner) — substituir upload de imagem do banner
3. **ClientProfile.tsx** (Avatar) — substituir upload de avatar
4. **AdminSettings.tsx** — adicionar seção "Identidade Visual" com upload da logo
5. **Contact.tsx** — upload de arquivo de referência (opcional, manter simples pois não é imagem obrigatoriamente)

## 4. Logo dinâmica via admin

### Migration
- Adicionar setting `site_logo_url` na tabela `site_settings` (via insert tool, não migration)

### AdminSettings.tsx
- Nova seção "Identidade Visual" no topo com:
  - Upload de logo usando `ImageUploadWithEditor`
  - Ao fazer upload: envia para bucket `banners` (público), salva URL em `site_settings.site_logo_url`
  - Preview da logo atual

### Header.tsx e AdminLayout.tsx
- Usar `useSettings().getSetting('site_logo_url')` para renderizar `<img>` da logo
- Fallback para texto "STARTMÍDIA" se não houver logo configurada

## 5. Criar usuário admin

### Migration SQL
- Inserir registro na tabela `user_roles` com role `admin` para o usuário com email `albertodecamargo@gmail.com` **após** ele se cadastrar
- Como não podemos criar usuários diretamente via migration, a abordagem será:
  - Criar uma database function `promote_to_admin(email text)` que busca o user_id pelo email na tabela profiles e insere em user_roles
  - Ou: o usuário se cadastra normalmente pelo /login e depois executamos um INSERT via insert tool para promovê-lo a admin

### Fluxo recomendado:
1. O usuário se cadastra em /login com email `albertodecamargo@gmail.com` e senha `ae280510`
2. Após cadastro, usar insert tool para adicionar role admin: `INSERT INTO user_roles (user_id, role) SELECT user_id, 'admin' FROM profiles WHERE email = 'albertodecamargo@gmail.com'`

## Detalhes técnicos
- `react-image-crop`: fornece componente `<ReactCrop>` com seleção visual de área de corte
- Filtros via CSS `filter` property na preview e via Canvas `ctx.filter` na exportação final
- Canvas workflow: carregar imagem → aplicar crop (drawImage com coordenadas) → aplicar filtros → toBlob() → File
- O componente ImageUploadWithEditor aceita formatos: JPG, PNG, WebP, GIF, SVG
- Tamanho máximo configurável por prop (default 5MB)

