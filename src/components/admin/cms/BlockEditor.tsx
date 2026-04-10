import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CmsImageUpload } from './CmsImageUpload';
import { Plus, Trash2 } from 'lucide-react';

type Data = Record<string, unknown>;
type UpdateFn = (key: string, value: unknown) => void;

interface BlockEditorProps {
  type: string;
  data: Data;
  onUpdate: UpdateFn;
}

// Helper for array items
function updateArrayItem<T>(arr: T[], idx: number, patch: Partial<T>): T[] {
  return arr.map((item, i) => (i === idx ? { ...item, ...patch } : item));
}

export const BlockEditor = ({ type, data, onUpdate }: BlockEditorProps) => {
  switch (type) {
    case 'hero':
      return <HeroEditor data={data} onUpdate={onUpdate} />;
    case 'rich_text':
      return <RichTextEditor data={data} onUpdate={onUpdate} />;
    case 'image':
      return <ImageBlockEditor data={data} onUpdate={onUpdate} />;
    case 'cards':
      return <CardsEditor data={data} onUpdate={onUpdate} />;
    case 'gallery':
      return <GalleryEditor data={data} onUpdate={onUpdate} />;
    case 'faq':
      return <FaqEditor data={data} onUpdate={onUpdate} />;
    case 'cta':
      return <CtaEditor data={data} onUpdate={onUpdate} />;
    case 'spacer':
      return <SpacerEditor data={data} onUpdate={onUpdate} />;
    default:
      return <p className="text-sm text-muted-foreground">Editor indisponível para "{type}".</p>;
  }
};

// ── Hero ──
const HeroEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <div><Label className="text-xs">Título *</Label><Input value={(data.title as string) || ''} onChange={e => onUpdate('title', e.target.value)} /></div>
      <div><Label className="text-xs">Subtítulo</Label><Input value={(data.subtitle as string) || ''} onChange={e => onUpdate('subtitle', e.target.value)} /></div>
      <div><Label className="text-xs">Texto do CTA</Label><Input value={(data.cta_label as string) || ''} onChange={e => onUpdate('cta_label', e.target.value)} /></div>
      <div><Label className="text-xs">Link do CTA</Label><Input value={(data.cta_link as string) || ''} onChange={e => onUpdate('cta_link', e.target.value)} /></div>
    </div>
    <CmsImageUpload value={(data.background_image as string) || ''} onChange={v => onUpdate('background_image', v)} showAlt={false} label="Imagem de Fundo" />
  </div>
);

// ── Rich Text ──
const RichTextEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => (
  <div>
    <Label className="text-xs">Conteúdo (Markdown/HTML) *</Label>
    <Textarea value={(data.content as string) || ''} onChange={e => onUpdate('content', e.target.value)} rows={10} className="font-mono text-sm" />
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
    <div><Label className="text-xs">Legenda</Label><Input value={(data.caption as string) || ''} onChange={e => onUpdate('caption', e.target.value)} /></div>
  </div>
);

// ── Cards ──
const CardsEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => {
  const items = (Array.isArray(data.items) ? data.items : []) as { title: string; description: string; icon: string; image: string; link: string }[];
  const setItems = (v: typeof items) => onUpdate('items', v);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label className="text-xs">Título da Seção</Label><Input value={(data.title as string) || ''} onChange={e => onUpdate('title', e.target.value)} /></div>
        <div><Label className="text-xs">Subtítulo</Label><Input value={(data.subtitle as string) || ''} onChange={e => onUpdate('subtitle', e.target.value)} /></div>
      </div>
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded bg-muted/30 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Card {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label className="text-xs">Título *</Label><Input value={item.title} onChange={e => setItems(updateArrayItem(items, i, { title: e.target.value }))} /></div>
            <div><Label className="text-xs">Descrição</Label><Input value={item.description} onChange={e => setItems(updateArrayItem(items, i, { description: e.target.value }))} /></div>
            <div><Label className="text-xs">Ícone (nome)</Label><Input value={item.icon} onChange={e => setItems(updateArrayItem(items, i, { icon: e.target.value }))} placeholder="Ex: Star" /></div>
            <div><Label className="text-xs">Link</Label><Input value={item.link} onChange={e => setItems(updateArrayItem(items, i, { link: e.target.value }))} /></div>
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
          <div><Label className="text-xs">Legenda</Label><Input value={item.caption} onChange={e => setItems(updateArrayItem(items, i, { caption: e.target.value }))} /></div>
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
      {items.map((item, i) => (
        <div key={i} className="p-3 rounded bg-muted/30 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Pergunta {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div><Label className="text-xs">Pergunta *</Label><Input value={item.question} onChange={e => setItems(updateArrayItem(items, i, { question: e.target.value }))} /></div>
          <div><Label className="text-xs">Resposta *</Label><Textarea value={item.answer} onChange={e => setItems(updateArrayItem(items, i, { answer: e.target.value }))} rows={3} /></div>
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
  <div className="grid gap-3 sm:grid-cols-2">
    <div><Label className="text-xs">Título *</Label><Input value={(data.title as string) || ''} onChange={e => onUpdate('title', e.target.value)} /></div>
    <div><Label className="text-xs">Texto</Label><Input value={(data.text as string) || ''} onChange={e => onUpdate('text', e.target.value)} /></div>
    <div><Label className="text-xs">Texto do Botão *</Label><Input value={(data.button_label as string) || ''} onChange={e => onUpdate('button_label', e.target.value)} /></div>
    <div><Label className="text-xs">Link do Botão *</Label><Input value={(data.button_link as string) || ''} onChange={e => onUpdate('button_link', e.target.value)} /></div>
  </div>
);

// ── Spacer ──
const SpacerEditor = ({ data, onUpdate }: { data: Data; onUpdate: UpdateFn }) => {
  const h = typeof data.height === 'number' ? data.height : 40;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Label className="text-xs whitespace-nowrap">Altura: {h}px</Label>
        <Slider value={[h]} onValueChange={([v]) => onUpdate('height', v)} min={8} max={200} step={4} className="flex-1" />
      </div>
      <div className="border border-dashed border-border rounded" style={{ height: `${Math.min(h, 80)}px` }} />
    </div>
  );
};
