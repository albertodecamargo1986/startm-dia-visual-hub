
# Plano: Simplificar e Centralizar o Editor de Etiquetas

## Problemas visíveis
1. Canvas ocupa espaço excessivo e fica descentralizado (deslocado para a direita/cima)
2. A etiqueta (4x4cm redonda) aparece enorme no canvas — deveria ter tamanho proporcional e centralizado
3. Interface visual confusa com muitos painéis e opções simultâneas
4. O `fitToContainer` não limita corretamente o tamanho visual — canvas aparece maior que a viewport útil

## Mudanças planejadas

### 1. Corrigir fitToContainer para centralizar e reduzir o canvas
- Limitar `scale` para que o canvas nunca exceda ~80% do container (atualmente usa `Math.min(..., 1)` mas o canvas real em px é enorme por causa do `CANVAS_SCALE = 4`)
- O canvas de 4x4cm = 40mm = ~151px real * 4 (CANVAS_SCALE) = ~604px. Com zoom 68% fica ~410px CSS, mas o container tem ~700px. O canvas wrapper deveria estar perfeitamente centrado — o issue é o `p-2` padding no wrapper e flex alignment
- Garantir que o wrapper do canvas use `margin: auto` e flex center funcione corretamente

### 2. Reduzir complexidade visual do editor
- Esconder a barra de toolbar duplicada (já tem botões "Adicionar" no painel esquerdo E na toolbar central — remover duplicação)
- Simplificar a toolbar central: manter apenas Texto, Forma, Imagem, Undo/Redo, Zoom e Delete
- Remover botões redundantes de formas da toolbar (círculo separado, grid, keyboard shortcuts)

### 3. Melhorar o canvas wrapper
- Remover `border-dashed` e `p-2` do wrapper — usar apenas um fundo neutro (cinza claro) com a etiqueta centralizada nele, como no Canva
- O fundo cinza simula a "mesa de trabalho" e a etiqueta branca fica no centro
- Aplicar `display: flex; align-items: center; justify-content: center` corretamente no containerRef

### 4. Limpar painel esquerdo
- Manter apenas: Adicionar (Texto/Imagem/Formas), Fundo, Templates
- Mover "Molduras & Ornamentos" para dentro de Templates ou colapsar por default
- Remover "Ações" (duplicar/salvar como) do painel esquerdo — já estão na top bar

## Arquivos modificados
- `src/pages/client/LabelEditor.tsx` — Ajustes no layout, fitToContainer, toolbar simplificada, canvas wrapper limpo (~80 linhas alteradas)

## Escopo
- Sem mudanças de banco de dados
- Sem novas dependências
- Foco em layout/CSS e remoção de duplicação de UI
