

# Plano: Melhorias de UX no Editor de Etiquetas

## Problemas identificados (da imagem e descrição)
1. Texto adicionado aparece no canto, pequeno, sem centralização automática
2. Formato da etiqueta (contorno) não é visível como linha delimitadora no canvas
3. Controle de tamanho do texto pouco prático
4. Galeria de etiquetas prontas escondida/inexistente no fluxo de criação
5. Bordas prontas pouco acessíveis
6. Botões pouco intuitivos

## Mudanças planejadas

### 1. Contorno visual do formato no canvas
- Adicionar uma borda tracejada (stroke-only shape) ao canvas que mostre o limite real da etiqueta (redonda, quadrada, retangular, etc.)
- Esse objeto será não-selecionável, não-editável, sempre por baixo de tudo
- Renderizado como Fabric object com `selectable: false, evented: false`

### 2. Texto centralizado e com tamanho proporcional
- Alterar `addText()` para calcular fontSize proporcional ao tamanho da etiqueta (~15% da menor dimensão)
- Centralizar o texto usando `originX: 'center', originY: 'center'` no centro exato do canvas
- Texto inicial: "Seu Texto" ao invés de "Texto"

### 3. Controle de tamanho do texto melhorado
- Adicionar botões +/- ao lado do input numérico de fontSize
- Adicionar presets rápidos de tamanho (12, 16, 20, 24, 32, 48)
- Já existe input numérico na linha 1177, expandir com controles visuais

### 4. Galeria de etiquetas prontas no Wizard (Passo 4)
- Adicionar um passo opcional no wizard após o nome: "Começar do zero ou usar um modelo?"
- Mostrar grid visual de templates com preview renderizado (mini-canvas ou SVG)
- Ao clicar, aplica o template e abre o editor — o usuário só precisa editar o texto
- Templates já existem em `label-templates.ts`, falta expô-los no fluxo de criação

### 5. Galeria de bordas mais visual
- Substituir botões de texto por cards visuais com preview da borda (mini-canvas ou ícone representativo)
- Organizar em grid mais amplo no painel esquerdo

### 6. Botões mais intuitivos
- Adicionar labels de texto aos botões principais da toolbar (Texto, Forma, Imagem) em telas maiores
- Agrupar ações do painel direito com headings mais claros
- Adicionar ícones + labels nos botões de alinhamento

### 7. Canvas centralizado na tela
- Ajustar `fitToContainer` para garantir centralização correta usando flex center (já usa, mas verificar se o canvas wrapper não está desalinhado por causa do padding)

## Arquivos modificados
- `src/pages/client/LabelEditor.tsx` — Todas as mudanças acima (contorno, addText, wizard step, toolbar, painel de propriedades, galeria de bordas)
- `src/lib/label-templates.ts` — Possível adição de 3-4 templates novos focados em "só mudar o texto"

## Escopo técnico
- Sem mudanças de banco de dados
- Sem novas dependências
- Toda lógica de Fabric.js, salvamento e exportação permanece intacta
- ~200 linhas modificadas/adicionadas

