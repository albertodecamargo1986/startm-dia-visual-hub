

# Plano: Redesign do Editor de Etiquetas — Layout estilo Photoshop

## Problemas atuais
1. Layout confuso — painel esquerdo largo, canvas deslocado, painel direito aparece/desaparece
2. Toolbar central com poucos controles, sem acesso rápido às ferramentas
3. Canvas não fica centralizado de forma estável
4. Área de pintura (canvas) não tem tamanho visualmente proporcional à etiqueta
5. Falta de uma toolbar vertical de ferramentas como no Photoshop

## Mudanças planejadas

### 1. Layout Photoshop: Toolbar vertical à esquerda
Substituir o botão "Painel de design" por uma **barra de ferramentas vertical fina** (48px) no lado esquerdo com ícones:
- Seleção (cursor)
- Texto (T)
- Retângulo, Círculo, Triângulo, Linha
- Imagem
- Mão (pan) — futuro

Ao clicar numa ferramenta, a ação é executada diretamente (addText, addShape, etc). Sem painel colapsável.

### 2. Painel lateral esquerdo simplificado
O painel de "Design" (templates, fundo, molduras) vira um **drawer/painel togglável** que abre por cima do canvas quando necessário, em vez de ocupar espaço fixo. Ou fica como uma aba fina colapsada.

Alternativa mais simples: manter o painel mas reduzir para **w-48** (192px) e colapsar por padrão. Abrir apenas via ícone na toolbar.

### 3. Canvas centralizado com fundo de "mesa de trabalho"
- Container do canvas usa `bg-neutral-800` (cinza escuro, como Photoshop) com checkerboard pattern sutil
- Canvas com `margin: auto` e sombra para parecer um "papel" na mesa
- `fitToContainer` limita a 70% do container (não 80%) para dar mais respiro
- Remover `rounded` do canvas-wrapper (etiqueta não é arredondada no editor, o clipPath já cuida do formato)

### 4. Barra superior (top bar) mais limpa
- Manter: Voltar, nome do projeto, badge de formato, Save, Versão, Pedir
- Mover undo/redo e zoom para a **barra inferior (status bar)** — como no Photoshop
- Remover toolbar central duplicada (a que tem Grid, Delete, etc.)

### 5. Painel de propriedades (direita) — sempre visível
Em vez de aparecer/desaparecer quando seleciona objeto, o painel direito fica **sempre visível** com conteúdo contextual:
- Sem seleção: mostra propriedades do canvas (fundo, tamanho, grid)
- Com seleção: mostra propriedades do objeto (como já faz)

### 6. Status bar inferior melhorada
Mover para a barra inferior:
- Undo/Redo
- Zoom slider (ou +/- com %)
- Snap toggle
- Info do formato
- Grid toggle

## Estrutura visual final

```text
┌─────────────────────────────────────────────────────────┐
│ ← Voltar │ Nome do projeto │ Badge │ Save │ Versão │Pedir│  ← Top bar
├──┬──────────────────────────────────────────────┬───────┤
│  │                                              │Props  │
│T │                                              │───────│
│🔲│         ████████████████████                 │Cor    │
│⭕│         █   CANVAS/LABEL   █                 │Fonte  │
│△ │         █                  █                 │Tam.   │
│— │         ████████████████████                 │B I    │
│🖼│              Mesa escura                      │Align  │
│  │                                              │...    │
├──┴──────────────────────────────────────────────┴───────┤
│ ↩ ↪ │ 🔍- 68% 🔍+ │ Snap ✓ │ Grid │ Redondo 4×4cm    │  ← Status bar
└─────────────────────────────────────────────────────────┘
```

## Arquivos modificados
- `src/pages/client/LabelEditor.tsx` — Reestruturação do layout (~150 linhas alteradas):
  - Nova toolbar vertical à esquerda (ferramentas)
  - Remover toolbar central horizontal
  - Painel direito sempre visível com conteúdo contextual
  - Status bar com undo/redo/zoom/grid/snap
  - Canvas wrapper com fundo escuro (estilo Photoshop)
  - Painel esquerdo (Design/Camadas) acessível via ícone na toolbar, colapsado por padrão
  - fitToContainer ajustado para 70%

## Sem mudanças
- Banco de dados, RLS, edge functions
- Lógica de Fabric.js, salvamento, templates
- Funcionalidades existentes (apenas reposicionadas)

