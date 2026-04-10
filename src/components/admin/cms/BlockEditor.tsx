import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CmsImageUpload } from './CmsImageUpload';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

type Data = Record<string, unknown>;
type UpdateFn = (key: string, value: unknown) => void;

interface BlockEditorProps {
  type: string;
  data: Data;
  onUpdate: UpdateFn;
}

function updateArrayItem<T>(arr: T[], idx: number, patch: Partial<T>): T[] {
  return arr.map((item, i) => (i === idx ? { ...item, ...patch } : item));
}

const FieldHelp = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help inline ml-1" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
  </Tooltip>
);

const FieldLabel = ({ children, help }: { children: React.ReactNode; help?: string }) => (
  <Label className="text-xs flex items-center gap-0.5">
    {children}
    {help && <FieldHelp text={help} />}
  </Label>
);

export const BlockEditor = ({ type, data, onUpdate }: BlockEditorProps) => {
  switch (type) {
    case 'hero': return <HeroEditor data={data} onUpdate={onUpdate} />;
    case 'rich_text': return <RichTextEditor data={data} onUpdate={onUpdate} />;
    case 'image': return <ImageBlockEditor data={data} onUpdate={onUpdate} />;
    case 'cards': return <CardsEditor data={data} onUpdate={onUpdate} />;
    case 'gallery': return <GalleryEditor data={data} onUpdate={onUpdate} />;
    case 'faq': return <FaqEditor data={data} onUpdate={onUpdate} />;
    case 'cta': return <CtaEditor data={data} onUpdate={onUpdate} />;
    case 'spacer': return <SpacerEditor data={data} onUpdate={onUpdate} />;
    default: return <p className="text-sm text-muted-foreground">Editor indisponível para "{type}".</p>;
  }
};

// ── Hero ──
const HeroEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <FieldLabel help="Texto principal exibido em destaque sobre a imagem de fundo.">Título *</FieldLabel>
        <Input value={(data.title as string) || ''} onChange={e => onUpdate('title', e.target.value)} placeholder="Ex: Bem-vindo à StartMídia" />
      </div>
      <div>
        <FieldLabel help="Texto secundário abaixo do título. Descreva brevemente o que a página oferece.">Subtítulo</FieldLabel>
        <Input value={(data.subtitle as string) || ''} onChange={e => onUpdate('subtitle', e.target.value)} placeholder="Ex: Soluções em comunicação visual" />
      </div>
      <div>
        <FieldLabel help="Texto do botão de ação. Deixe vazio para não exibir botão.">Texto do CTA</FieldLabel>
        <Input value={(data.cta_label as string) || ''} onChange={e => onUpdate('cta_label', e.target.value)} placeholder="Ex: Ver Produtos" />
      </div>
      <div>
        <FieldLabel help="URL para onde o botão vai direcionar. Pode ser uma página interna (/loja) ou externa (https://...).">Link do CTA</FieldLabel>
        <Input value={(data.cta_link as string) || ''} onChange={e => onUpdate('cta_link', e.target.value)} placeholder="Ex: /loja" />
      </div>
    </div>
    <CmsImageUpload value={(data.background_image as string) || ''} onChange={v => onUpdate('background_image', v)} showAlt={false} label="Imagem de Fundo" />
    <p className="text-xs text-muted-foreground">💡 Use imagens com pelo menos 1920×600px para melhor qualidade.</p>
  </div>
);

// ── Rich Text ──
const RichTextEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => (
  <div>
    <FieldLabel help="Escreva o conteúdo em HTML. Parágrafos usam <p>, títulos usam <h2>, <h3>, etc. Listas: <ul><li>Item</li></ul>.">Conteúdo (HTML) *</FieldLabel>
    <Textarea
      value={(data.content as string) || ''}
      onChange={e => onUpdate('content', e.target.value)}
      rows={10}
      className="font-mono text-sm"
      placeholder={'<h2>Título da seção</h2>\n<p>Escreva seu conteúdo aqui. Use tags HTML para formatar.</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>'}
    />
    <p className="text-xs text-muted-foreground mt-1">💡 Dica: use &lt;p&gt; para parágrafos, &lt;h2&gt; para títulos, &lt;strong&gt; para negrito.</p>
  </div>
);

// ── Image ──
const ImageBlockEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => (
  <div className="space-y-3">
    <CmsImageUpload
      value={(data.url as string) || ''}
      alt={(data.alt as string) || ''}
      onChange={v => onUpdate('url', v)}
      onAltChange={v => onUpdate('alt', v)}
      label="Imagem *"
    />
    <div>
      <FieldLabel help="Texto exibido abaixo da imagem. Opcional.">Legenda</FieldLabel>
      <Input value={(data.caption as string) || ''} onChange={e => onUpdate('caption', e.target.value)} placeholder="Ex: Fachada da nossa loja" />
    </div>
  </div>
);

// ── Cards ──
const CardsEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => {
  const items = (Array.isArray(data.items) ? data.items : []) as { title: string; description: string; icon: string; image: string; link: string }[];
  const setItems = (v: typeof items) => onUpdate('items', v);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel help="Título exibido acima da grade de cards.">Título da Seção</FieldLabel>
          <Input value={(data.title as string) || ''} onChange={e => onUpdate('title', e.target.value)} placeholder="Ex: Nossos Serviços" />
        </div>
        <div>
          <FieldLabel help="Texto complementar abaixo do título.">Subtítulo</FieldLabel>
          <Input value={(data.subtitle as string) || ''} onChange={e => onUpdate('subtitle', e.target.value)} placeholder="Ex: Conheça nossas soluções" />
        </div>
      </div>
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded bg-muted/30 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Card {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><FieldLabel>Título *</FieldLabel><Input value={item.title} onChange={e => setItems(updateArrayItem(items, i, { title: e.target.value }))} placeholder="Ex: Adesivos" /></div>
            <div><FieldLabel>Descrição</FieldLabel><Input value={item.description} onChange={e => setItems(updateArrayItem(items, i, { description: e.target.value }))} placeholder="Ex: Adesivos em vinil de alta qualidade" /></div>
            <div><FieldLabel help="Nome do ícone Lucide (opcional). Ex: Star, Shield, Zap.">Ícone</FieldLabel><Input value={item.icon} onChange={e => setItems(updateArrayItem(items, i, { icon: e.target.value }))} placeholder="Ex: Star" /></div>
            <div><FieldLabel help="URL de destino ao clicar no card.">Link</FieldLabel><Input value={item.link} onChange={e => setItems(updateArrayItem(items, i, { link: e.target.value }))} placeholder="Ex: /loja/adesivos" /></div>
          </div>
          <CmsImageUpload value={item.image} onChange={v => setItems(updateArrayItem(items, i, { image: v }))} showAlt={false} label="Imagem do Card" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setItems([...items, { title: '', description: '', icon: '', image: '', link: '' }])}>
        <Plus className="mr-1 h-3 w-3" />Adicionar Card
      </Button>
    </div>
  );
};

// ── Gallery ──
const GalleryEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => {
  const items = (Array.isArray(data.items) ? data.items : []) as { url: string; alt: string; caption: string }[];
  const setItems = (v: typeof items) => onUpdate('items', v);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">📷 Adicione imagens à galeria. O texto alternativo (alt) é importante para acessibilidade e SEO.</p>
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded bg-muted/30 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Imagem {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <CmsImageUpload
            value={item.url}
            alt={item.alt}
            onChange={v => setItems(updateArrayItem(items, i, { url: v }))}
            onAltChange={v => setItems(updateArrayItem(items, i, { alt: v }))}
            label="Imagem *"
          />
          <div><FieldLabel>Legenda</FieldLabel><Input value={item.caption} onChange={e => setItems(updateArrayItem(items, i, { caption: e.target.value }))} placeholder="Ex: Banner promocional verão 2025" /></div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setItems([...items, { url: '', alt: '', caption: '' }])}>
        <Plus className="mr-1 h-3 w-3" />Adicionar Imagem
      </Button>
    </div>
  );
};

// ── FAQ ──
const FaqEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => {
  const items = (Array.isArray(data.items) ? data.items : []) as { question: string; answer: string }[];
  const setItems = (v: typeof items) => onUpdate('items', v);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">❓ Adicione perguntas e respostas. Elas serão exibidas em formato acordeão na página.</p>
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded bg-muted/30 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Pergunta {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div><FieldLabel>Pergunta *</FieldLabel><Input value={item.question} onChange={e => setItems(updateArrayItem(items, i, { question: e.target.value }))} placeholder="Ex: Qual o prazo de entrega?" /></div>
          <div><FieldLabel>Resposta *</FieldLabel><Textarea value={item.answer} onChange={e => setItems(updateArrayItem(items, i, { answer: e.target.value }))} rows={3} placeholder="Ex: O prazo varia de 3 a 7 dias úteis, dependendo do produto e região." /></div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setItems([...items, { question: '', answer: '' }])}>
        <Plus className="mr-1 h-3 w-3" />Adicionar Pergunta
      </Button>
    </div>
  );
};

// ── CTA ──
const CtaEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <div><FieldLabel help="Título da chamada para ação exibido em destaque.">Título *</FieldLabel><Input value={(data.title as string) || ''} onChange={e => onUpdate('title', e.target.value)} placeholder="Ex: Pronto para começar?" /></div>
      <div><FieldLabel help="Texto complementar abaixo do título.">Texto</FieldLabel><Input value={(data.text as string) || ''} onChange={e => onUpdate('text', e.target.value)} placeholder="Ex: Entre em contato e solicite um orçamento" /></div>
      <div><FieldLabel help="Texto exibido dentro do botão.">Texto do Botão *</FieldLabel><Input value={(data.button_label as string) || ''} onChange={e => onUpdate('button_label', e.target.value)} placeholder="Ex: Solicitar Orçamento" /></div>
      <div><FieldLabel help="URL de destino do botão.">Link do Botão *</FieldLabel><Input value={(data.button_link as string) || ''} onChange={e => onUpdate('button_link', e.target.value)} placeholder="Ex: /contato" /></div>
    </div>
  </div>
);

// ── Spacer ──
const SpacerEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => {
  const h = typeof data.height === 'number' ? data.height : 40;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <FieldLabel help="Ajuste a altura do espaço em pixels. Use para separar blocos visualmente.">Altura: {h}px</FieldLabel>
        <Slider value={[h]} onValueChange={([v]) => onUpdate('height', v)} min={8} max={200} step={4} className="flex-1" />
      </div>
      <div className="border border-dashed border-border rounded" style={{ height: `${Math.min(h, 80)}px` }} />
      <p className="text-xs text-muted-foreground">💡 Espaçamento visual entre blocos. A pré-visualização acima é proporcional.</p>
    </div>
  );
};
