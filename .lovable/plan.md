

# Repaginação Visual + Sistema de Personalização de Temas

## Resumo
Criar um sistema completo de temas com paletas pré-prontas (claro/escuro/variações azul), página de personalização no admin, e aplicação em tempo real em todo o site via CSS variables dinâmicas.

## Alterações

### 1. `src/contexts/ThemeContext.tsx` — Criar
- Contexto que lê as configurações de tema do `site_settings` (chaves como `theme_mode`, `theme_palette`, `theme_custom_colors`)
- Aplica CSS variables no `:root` dinamicamente ao carregar e quando alteradas
- Expõe `currentTheme`, `applyTheme()` para uso global
- Sincroniza com `SettingsContext` — mudanças no admin refletem instantaneamente

### 2. `src/pages/admin/AdminTheme.tsx` — Criar
- Página completa de personalização visual com:
  - **Seletor de modo**: Claro / Escuro / Auto
  - **Paletas pré-prontas** (6-8 opções):
    - "Azul StartMídia" (tons de azul da logo + fundo claro)
    - "Azul Escuro" (azul da logo + fundo dark)
    - "Minimalista Claro" (branco/cinza suave)
    - "Dark Premium" (escuro atual refinado)
    - "Energia Laranja" (laranja accent + claro)
    - "Profissional Cinza" (neutro corporativo)
  - **Editor avançado**: inputs de cor para background, foreground, primary, secondary, accent, muted, card, border
  - **Seletor de fontes**: opções de font-family para títulos e corpo
  - **Preview ao vivo**: miniatura do site mostrando como ficará
  - Botão salvar grava tudo no `site_settings`

### 3. `src/index.css` — Atualizar
- Manter as variáveis atuais como fallback (tema "Dark Premium")
- Adicionar classe `.theme-light` com variáveis claras
- Refinar a paleta padrão para usar tons de azul da logomarca como primary/secondary

### 4. `src/App.tsx` — Adicionar ThemeProvider
- Envolver app com `ThemeProvider` que aplica o tema lido do banco

### 5. `src/pages/admin/AdminLayout.tsx` — Adicionar link
- Novo item "Aparência" com ícone Paintbrush no menu lateral

### 6. Rotas — `src/App.tsx`
- `/admin/aparencia` → `AdminTheme`

### 7. Paletas pré-definidas (constantes em `src/lib/themes.ts`)
- Cada paleta é um objeto com todos os valores HSL para as CSS variables
- Inclui modo claro e escuro por paleta
- Inclui configurações de fonte (display + body)

## Fluxo
1. Admin acessa `/admin/aparencia`
2. Escolhe paleta ou customiza cores individuais
3. Preview atualiza em tempo real no painel
4. Ao salvar, grava no `site_settings` (chave `theme_config` com JSON completo)
5. `ThemeContext` detecta mudança, aplica CSS variables no `:root`
6. Todo o site atualiza instantaneamente — não precisa recarregar

## Detalhes técnicos
- Sem migration: usa `site_settings` existente (key/value)
- Tema armazenado como JSON na chave `theme_config`
- CSS variables aplicadas via `document.documentElement.style.setProperty()`
- Fontes carregadas dinamicamente via Google Fonts link injection
- O tema padrão será "Azul StartMídia Claro" — tons azuis harmonizados com fundo claro

