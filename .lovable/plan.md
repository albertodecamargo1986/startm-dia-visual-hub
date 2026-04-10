

# Plano: Centralizar e ampliar a área de pintura da etiqueta

## Problema
O canvas da etiqueta está pequeno e difícil de usar. O `fitToContainer` limita a 70% do container e subtrai 48px extras, resultando numa área de trabalho pequena demais. O canvas precisa ocupar mais espaço e ficar visualmente centralizado de forma clara.

## Mudanças em `src/pages/client/LabelEditor.tsx`

### 1. Ampliar escala do canvas
- Alterar `fitToContainer`: remover o fator `0.7` e usar `0.9` (90% do container), e reduzir a margem de 48px para 24px
- Isso fará a etiqueta ocupar quase toda a área disponível, muito mais fácil de desenhar

### 2. Melhorar centralização visual
- Adicionar padding interno no container do canvas (`p-4`) para respiro uniforme
- Garantir que o `canvas-wrapper` tenha `display: flex` e centralização absoluta com `margin: auto` funcional

### 3. Remover limite `scale ≤ 1`
- Atualmente `Math.min(..., 1)` impede que etiquetas pequenas (4x4cm) sejam ampliadas para caber na tela
- Alterar para `Math.min(..., 3)` para permitir zoom automático de etiquetas pequenas, tornando-as usáveis

### 4. Borda visual na área de desenho
- Adicionar uma borda branca fina (`ring-1 ring-white/20`) no `canvas-wrapper` para delimitar claramente onde é a área editável

## Resumo técnico
- Arquivo: `src/pages/client/LabelEditor.tsx`
- ~10 linhas alteradas na função `fitToContainer` e no JSX do container
- Sem mudanças em banco de dados, lógica de salvamento, ou outras funcionalidades

