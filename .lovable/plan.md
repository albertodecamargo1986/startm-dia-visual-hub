

# Plano: Desenho Livre, Elementos Prontos e Melhorias de Interação

## Mudanças planejadas

### 1. Ferramenta de Desenho Livre (Freehand Drawing)
Adicionar botão "Desenho livre" na toolbar vertical. Usa o modo de desenho nativo do Fabric.js (`canvas.isDrawingMode = true`) com controles de:
- Espessura do traço (1-20px)
- Cor do traço
- Borracha (apaga último traço)

Ao ativar, o cursor muda para pincel. Ao clicar em "Seleção", volta ao modo normal.

### 2. Nova aba "Elementos" no painel overlay esquerdo
Adicionar uma terceira aba no painel (Design | Camadas | **Elementos**) com uma biblioteca de formas SVG prontas organizadas por categoria:

**Setas** (8 variações): seta simples, seta dupla, seta curva, seta grossa, chevron
**Símbolos** (8 variações): estrela, coração, raio/relâmpago, diamante, coroa, medalha, check, xis
**Decorativos** (6 variações): onda, espiral, folha, flor, sol, gota
**Ícones** (6 variações): telefone, email, instagram, facebook, localização, carrinho

Cada elemento é inserido ao clicar, centralizado no canvas, e totalmente editável (cor, tamanho, rotação).

Implementação: os SVG paths serão definidos inline como constantes (sem dependências externas). Inseridos via `fabric.Path`.

### 3. Melhorias de escala e interação com mouse
- Habilitar `uniformScaling` por padrão para que imagens/objetos mantenham proporção ao redimensionar pelos cantos
- Adicionar controles de rotação mais visíveis (custom corner style)
- Configurar `cornerSize: 10`, `cornerColor`, `borderColor` para feedback visual melhor
- Lock aspect ratio toggle no painel de propriedades

### 4. Estado ativo na toolbar
Destacar visualmente a ferramenta ativa (seleção, texto, desenho, etc.) com `variant="secondary"` para indicar qual modo está ativo.

## Arquivos modificados
- `src/pages/client/LabelEditor.tsx`:
  - Novo estado `activeTool` para rastrear ferramenta selecionada
  - Função `toggleDrawingMode` para ativar/desativar desenho livre
  - Controles de pincel no painel direito quando modo desenho ativo
  - Nova aba "Elementos" no painel overlay com grid de SVG clicáveis
  - Configuração de `cornerSize`, `uniformScaling` nos objetos
  - Highlight da ferramenta ativa na toolbar
  - ~120 linhas de elementos SVG paths como constantes
  - ~40 linhas para drawing mode
  - ~20 linhas para melhorias de interação

## Sem mudanças
- Banco de dados, RLS, edge functions
- Lógica de salvamento, templates existentes, exportação

