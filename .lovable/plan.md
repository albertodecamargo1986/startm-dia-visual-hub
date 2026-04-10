

# Plano: Redesign UX do Editor de Etiquetas — Fácil e Intuitivo

## Problema atual
O editor de etiquetas tem muitas funcionalidades, mas a interface é densa e pouco visual. O fluxo de criação não é guiado, os painéis laterais são apertados com muitas abas pequenas, e os templates/formatos não têm prévia visual. Para um cliente leigo, é intimidador.

## Mudanças planejadas

### 1. Tela inicial com cards visuais de formatos
Em vez de um botão "Novo" que abre um dialog técnico, a tela inicial (sem projeto aberto) mostrará **cards visuais grandes** para cada formato de etiqueta — com ícone SVG do formato (círculo, quadrado, retângulo), nome e tamanhos disponíveis como chips clicáveis. O usuário vê e clica no que quer, sem precisar entender abas e selects.

### 2. Wizard simplificado de criação (3 passos inline)
Substituir o dialog "Nova Etiqueta" por um fluxo passo-a-passo visual:
- **Passo 1**: Escolher formato (cards visuais com shape preview)
- **Passo 2**: Escolher tamanho (botões grandes com preview proporcional)
- **Passo 3**: Nome e confirmar

### 3. Toolbar flutuante no canvas
Mover as ações principais (adicionar texto, formas, imagem, undo/redo, zoom) para uma **toolbar horizontal flutuante** acima do canvas, estilo Canva. Isso libera espaço lateral e é mais intuitivo.

### 4. Painel lateral simplificado
- Reduzir para **2 abas** no painel esquerdo: "Design" (templates + molduras juntos, com miniaturas coloridas) e "Meus Projetos"
- Painel direito: só aparece ao selecionar objeto, mostrando propriedades de forma contextual
- Templates mostram **preview visual colorido** (div com cores do template) em vez de só texto

### 5. Melhorias visuais gerais
- Cards de templates com mini-preview de cores (quadradinhos coloridos representando o template)
- Botões de ação com ícones maiores e labels claros
- Estado vazio mais convidativo com ilustração e CTA destacado
- Onboarding mais sutil (tooltip ao invés de overlay bloqueante)
- Barra de status inferior com info do formato atual

## Arquivos modificados
- `src/pages/client/LabelEditor.tsx` — Reescrita significativa do layout e componentes internos

## Escopo técnico
- Sem mudanças de banco de dados
- Sem novas dependências
- Toda lógica de canvas (Fabric.js), salvamento, exportação PDF e carrinho permanece intacta
- Apenas reorganização visual e UX

