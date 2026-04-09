

# Componentes de UX e Helpers

## Resumo
Criar 5 componentes auxiliares reutilizáveis: GuiaMedidas (dialog de guia), StatusBadge (badge de status), FileUploadZone (drag-and-drop com progresso), OrderTimeline (timeline vertical), e SEO (wrapper helmet com schema.org).

## Arquivos a criar

### 1. `src/components/GuiaMedidas.tsx`
- Dialog reutilizável com trigger customizável via props
- Props: `productName`, `productUnit`, `trigger` (ReactNode)
- Conteúdo completo com seções: Formatos Aceitos, Resolução Mínima, Como Medir, Tamanhos Padrão (tabela dinâmica), Cores, Dica
- Usa `Dialog`, `DialogContent`, `DialogHeader` do shadcn
- Ícones Lucide para checkmarks e x marks

### 2. `src/components/StatusBadge.tsx`
- Props: `status: string`, `type: 'order' | 'payment' | 'artwork'`
- Mapas de cores e labels por tipo:
  - `order`: usa `ORDER_STATUS_LABELS` e `ORDER_STATUS_COLORS` existentes
  - `payment`: pending/paid/refunded
  - `artwork`: pending/approved/rejected/revision
- Usa componente `Badge` do shadcn

### 3. `src/components/FileUploadZone.tsx`
- Props: `onFileSelect`, `acceptedTypes`, `maxSizeMB`, `multiple`, `showGuide?`, `productName?`
- Drag-and-drop com visual feedback (isDragging state)
- Preview de imagens inline, lista para outros formatos
- Barra de progresso via `Progress` do shadcn
- Exibe formatos aceitos e limite de tamanho
- Botão "📐 Guia de Medidas" integrado (abre `GuiaMedidas`) se `showGuide=true`

### 4. `src/components/OrderTimeline.tsx`
- Props: `events: OrderTimeline[]` (do tipo existente em `src/types`)
- Timeline vertical com linha conectora, ícones coloridos por status:
  - pending_payment → CreditCard (amarelo)
  - awaiting_artwork → Upload (azul)
  - in_production → Cog (laranja, `animate-spin`)
  - ready → Package (verde)
  - shipped → Truck (verde)
  - delivered → CheckCircle2 (verde escuro)
  - cancelled → XCircle (vermelho)
- Data formatada em PT-BR, mensagem do evento

### 5. `src/components/SEO.tsx`
- Props: `title`, `description`, `image?`, `canonical?`, `keywords?`
- Wrapper `react-helmet-async` com meta tags (og:title, og:description, og:image, twitter)
- Schema.org `LocalBusiness` JSON-LD com dados fixos da StartMídia (endereço Limeira/SP, telefone, horário)
- `HelmetProvider` já deve estar no App.tsx — verificar e adicionar se necessário

## Arquivo a modificar

### 6. `src/App.tsx`
- Wrap com `HelmetProvider` do `react-helmet-async` (se ainda não estiver)

## Detalhes técnicos
- Todos os componentes usam imports existentes (shadcn, lucide-react, tipos de `@/types`)
- `FileUploadZone` é independente do `ImageUploadWithEditor` — focado em arquivos de arte (PDF, AI, CDR, imagens)
- `SEO` sempre injeta o JSON-LD do LocalBusiness, com dados de contato vindos de props ou hardcoded
- `OrderTimeline` espera array ordenado por `created_at` desc

