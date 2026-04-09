

# Logo Inteligente com Redimensionamento Automático

## Resumo
Transformar o upload de logo no admin em um sistema inteligente que: (1) mostra ao admin os tamanhos necessários para cada local do site, (2) gera automaticamente todas as variações (header, footer, favicon, mobile) a partir de uma única imagem, e (3) oferece opções de fundo (transparente, branco, escuro) para harmonia visual.

## Como funciona

Ao fazer upload da logo, o sistema:
- Mostra um painel informativo com os tamanhos usados no site: Header (h-10 ≈ 40px altura), Footer, Mobile, Favicon
- Gera automaticamente 4 versões via Canvas: `site_logo_url` (header, max 200x40px), `site_logo_footer` (footer, max 250x50px), `site_logo_mobile` (mobile menu, max 160x32px), `site_logo_favicon` (favicon, 32x32px quadrado)
- Oferece opções: manter fundo transparente (PNG) ou adicionar fundo branco/escuro
- Salva todas as variações no storage e nas settings de uma vez

## Alterações

### 1. `src/pages/admin/AdminSettings.tsx`
- Substituir o campo simples de logo por um novo componente `LogoUploadManager`
- Adicionar keys `site_logo_footer`, `site_logo_mobile`, `site_logo_favicon` na seção Identidade Visual
- Mostrar preview de todas as variações geradas

### 2. `src/components/admin/LogoUploadManager.tsx` — Criar
- Componente dedicado para upload de logo com:
  - Card informativo: "Tamanhos gerados automaticamente" com tabela mostrando cada variação (local, dimensão, formato)
  - Upload via `ImageUploadWithEditor` (já existente, com editor de corte/filtros)
  - Após upload, gera via Canvas as 4 variações automaticamente
  - Select de opção de fundo: Transparente (PNG), Fundo Branco, Fundo Escuro
  - Preview lado a lado das variações geradas (simulando header claro, footer escuro)
  - Botão "Gerar e Salvar Todas as Versões"
- Função `generateVariations(file: File)`:
  - Carrega imagem no Canvas
  - Para cada tamanho, redimensiona mantendo proporção (contain)
  - Favicon: crop central quadrado
  - Exporta PNG (transparência) ou JPG (com fundo)
  - Upload de cada variação no storage `banners/logo-header-xxx.png`, etc.
  - Retorna URLs para salvar nas settings

### 3. `src/components/layout/Header.tsx`
- Usar `site_logo_mobile` no menu mobile (SheetContent) quando disponível, fallback para `site_logo_url`

### 4. `src/components/layout/Footer.tsx`
- Usar `site_logo_footer` quando disponível, fallback para `site_logo_url`, fallback para texto

### 5. `index.html`
- Link de favicon dinâmico (ou manter estático — o admin pode baixar o favicon gerado)

## Tabela de variações exibida ao admin

```text
┌──────────────┬────────────┬──────────┬─────────────────────┐
│ Local        │ Dimensão   │ Formato  │ Observação          │
├──────────────┼────────────┼──────────┼─────────────────────┤
│ Header       │ 200 x 40px │ PNG      │ Fundo transparente  │
│ Footer       │ 250 x 50px │ PNG      │ Visível em fundo    │
│ Menu Mobile  │ 160 x 32px │ PNG      │ Versão compacta     │
│ Favicon      │  32 x 32px │ PNG      │ Recorte quadrado    │
└──────────────┴────────────┴──────────┴─────────────────────┘
```

## Detalhes técnicos
- Canvas resize: criar `<canvas>` com dimensão alvo, `ctx.drawImage()` com cálculo de aspect ratio (contain)
- PNG com transparência: `canvas.toBlob(cb, 'image/png')`
- Fundo: se opção branco/escuro, `ctx.fillRect()` antes do `drawImage`
- Favicon quadrado: pegar o menor lado da imagem, crop central, resize para 32x32
- Todas as variações geradas client-side antes do upload (sem edge function)

