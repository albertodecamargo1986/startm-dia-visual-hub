

# Plano: Ajustes finais do Editor de Etiquetas vs Especificação

## Status atual — o que já está feito
- Rota `/cliente/etiquetas` com wizard de 4 etapas
- 25 formatos pré-definidos (redondo, quadrado, retangular, arredondados)
- Texto com Google Fonts, formas básicas, molduras, templates por nicho
- Camadas (ordenar, ocultar, bloquear, renomear)
- Undo/redo, auto-save, versionamento, lista "Meus designs"
- Contorno visual (delimiter), texto centralizado proporcional
- Controles de tamanho (+/-, presets), alinhamento, snap
- PDF export apenas no admin
- RLS por `user_id`

## Gaps identificados na especificação

### 1. Espaçamento de texto (charSpacing/lineHeight)
A spec pede "espaçamento" como ferramenta de texto. O painel de propriedades tem fonte, tamanho e cor, mas falta controle de **espaçamento entre letras** e **altura de linha**.

**Mudança**: Adicionar dois sliders no painel direito quando texto selecionado — `charSpacing` e `lineHeight`.

### 2. Alinhamento de texto (textAlign)
A spec pede alinhamento de texto (esquerda, centro, direita). Existe `alignObject` (posição no canvas), mas falta **alinhamento interno do texto** (textAlign).

**Mudança**: Adicionar botões left/center/right para `textAlign` no painel de propriedades de texto.

### 3. Estilo de texto (negrito/itálico)
Falta toggle de **bold** e **italic** no painel de propriedades.

**Mudança**: Adicionar botões B/I que alternam `fontWeight` e `fontStyle`.

### 4. Tutorial inicial mais claro
O onboarding atual é um banner dismissível com 1 frase. A spec pede "tutorial inicial de 3 passos".

**Mudança**: Expandir o banner de onboarding para 3 cards com ícones: (1) Escolha formato, (2) Personalize, (3) Salve e peça. Simples e direto, sem modal bloqueante.

### 5. Botão "Salvar rascunho" explícito
O save atual é um ícone de disquete na top bar. A spec pede botões claros: "Salvar rascunho", "Salvar versão".

**Mudança**: Renomear os tooltips e adicionar labels visíveis nos botões da top bar em telas maiores (lg+).

## Arquivos modificados
- `src/pages/client/LabelEditor.tsx` — Adicionar controles de texto (charSpacing, lineHeight, textAlign, bold/italic), melhorar onboarding, labels nos botões de salvar (~60 linhas adicionadas)

## Sem mudanças
- Banco de dados, RLS, edge functions — tudo já existe
- `label-templates.ts` — templates existentes são suficientes
- Exportação PDF — já restrita ao admin

