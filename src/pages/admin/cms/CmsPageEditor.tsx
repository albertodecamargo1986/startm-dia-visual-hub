import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cmsApi } from '@/lib/cms-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Globe, Eye, History, Loader2, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'rich_text', label: 'Texto Rico' },
  { value: 'cards', label: 'Cards' },
  { value: 'gallery', label: 'Galeria' },
  { value: 'faq', label: 'FAQ' },
  { value: 'cta', label: 'Call to Action' },
];

interface Section {
  id?: string;
  type: string;
  name: string;
  sort_order: number;
  enabled: boolean;
  data: Record<string, unknown>;
}

const defaultData: Record<string, Record<string, unknown>> = {
  hero: { title: '', subtitle: '', image_url: '', button_text: '', button_url: '' },
  rich_text: { content: '' },
  cards: { items: [{ title: '', description: '', image_url: '' }] },
  gallery: { images: [{ url: '', alt: '' }] },
  faq: { items: [{ question: '', answer: '' }] },
  cta: { title: '', description: '', button_text: '', button_url: '', bg_color: '' },
};

const CmsPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [page, setPage] = useState({ title: '', slug: '', seo_title: '', seo_description: '', is_home: false, status: 'draft' });
  const [sections, setSections] = useState<Section[]>([]);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['cms-page', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['cms-sections', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_sections').select('*').eq('page_id', id!).order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (pageData) {
      setPage({
        title: pageData.title,
        slug: pageData.slug,
        seo_title: pageData.seo_title || '',
        seo_description: pageData.seo_description || '',
        is_home: pageData.is_home,
        status: pageData.status,
      });
    }
  }, [pageData]);

  useEffect(() => {
    if (sectionsData) {
      setSections(sectionsData.map(s => ({
        id: s.id,
        type: s.type,
        name: s.name || '',
        sort_order: s.sort_order,
        enabled: s.enabled,
        data: (s.data as Record<string, unknown>) || {},
      })));
    }
  }, [sectionsData]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await cmsApi.saveDraft(
        { id, ...page },
        sections.map((s, i) => ({
          ...(s.id ? { id: s.id } : {}),
          type: s.type,
          name: s.name,
          sort_order: i,
          enabled: s.enabled,
          data: s.data,
        }))
      );
      if (res.success) {
        toast.success('Rascunho salvo!');
        qc.invalidateQueries({ queryKey: ['cms-page', id] });
        qc.invalidateQueries({ queryKey: ['cms-sections', id] });
      } else {
        toast.error(res.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }, [id, page, sections, qc]);

  const handlePublish = async () => {
    setPublishing(true);
    await handleSave();
    const res = await cmsApi.publish(id!);
    if (res.success) {
      toast.success('Página publicada!');
      setPage(p => ({ ...p, status: 'published' }));
      qc.invalidateQueries({ queryKey: ['cms-page', id] });
    } else {
      toast.error(res.error || 'Erro ao publicar');
    }
    setPublishing(false);
  };

  const addSection = (type: string) => {
    setSections(prev => [...prev, {
      type,
      name: SECTION_TYPES.find(t => t.value === type)?.label || type,
      sort_order: prev.length,
      enabled: true,
      data: { ...(defaultData[type] || {}) },
    }]);
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    setSections(prev => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const updateSectionData = (idx: number, key: string, value: unknown) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, data: { ...s.data, [key]: value } } : s));
  };

  const toggleSection = (idx: number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/admin/cms"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="font-display text-2xl">{page.title || 'Editor'}</h1>
          <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
            {page.status === 'published' ? 'Publicada' : 'Rascunho'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/cms/${id}/revisoes`}><History className="mr-2 h-4 w-4" />Revisões</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/p/${page.slug}`, '_blank')}>
            <Eye className="mr-2 h-4 w-4" />Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing}>
            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}Publicar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="mb-4">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card className="p-6 border-border max-w-2xl space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={page.title} onChange={e => setPage(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Slug</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">/p/</span>
                <Input value={page.slug} onChange={e => setPage(p => ({ ...p, slug: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>SEO Title</Label>
              <Input value={page.seo_title} onChange={e => setPage(p => ({ ...p, seo_title: e.target.value }))} />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea value={page.seo_description} onChange={e => setPage(p => ({ ...p, seo_description: e.target.value }))} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={page.is_home} onCheckedChange={v => setPage(p => ({ ...p, is_home: v }))} />
              <Label>Página inicial (Home)</Label>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <Card key={section.id || idx} className={`p-4 border-border ${!section.enabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Badge variant="outline" className="text-xs">{SECTION_TYPES.find(t => t.value === section.type)?.label || section.type}</Badge>
                  <Input value={section.name} onChange={e => setSections(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))} className="h-7 text-sm max-w-48" placeholder="Nome da seção" />
                  <div className="ml-auto flex items-center gap-1">
                    <Switch checked={section.enabled} onCheckedChange={() => toggleSection(idx)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSection(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <SectionEditor section={section} idx={idx} updateData={updateSectionData} />
              </Card>
            ))}

            <Card className="p-4 border-dashed border-border">
              <p className="text-sm text-muted-foreground mb-2">Adicionar seção:</p>
              <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.map(t => (
                  <Button key={t.value} variant="outline" size="sm" onClick={() => addSection(t.value)}>
                    <Plus className="mr-1 h-3 w-3" />{t.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Section-type-specific editors
const SectionEditor = ({ section, idx, updateData }: { section: Section; idx: number; updateData: (idx: number, key: string, value: unknown) => void }) => {
  const d = section.data;

  switch (section.type) {
    case 'hero':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="text-xs">Título</Label><Input value={(d.title as string) || ''} onChange={e => updateData(idx, 'title', e.target.value)} /></div>
          <div><Label className="text-xs">Subtítulo</Label><Input value={(d.subtitle as string) || ''} onChange={e => updateData(idx, 'subtitle', e.target.value)} /></div>
          <div><Label className="text-xs">URL da Imagem</Label><Input value={(d.image_url as string) || ''} onChange={e => updateData(idx, 'image_url', e.target.value)} /></div>
          <div><Label className="text-xs">Texto do Botão</Label><Input value={(d.button_text as string) || ''} onChange={e => updateData(idx, 'button_text', e.target.value)} /></div>
          <div><Label className="text-xs">URL do Botão</Label><Input value={(d.button_url as string) || ''} onChange={e => updateData(idx, 'button_url', e.target.value)} /></div>
        </div>
      );

    case 'rich_text':
      return (
        <div>
          <Label className="text-xs">Conteúdo (Markdown/HTML)</Label>
          <Textarea value={(d.content as string) || ''} onChange={e => updateData(idx, 'content', e.target.value)} rows={8} className="font-mono text-sm" />
        </div>
      );

    case 'cta':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="text-xs">Título</Label><Input value={(d.title as string) || ''} onChange={e => updateData(idx, 'title', e.target.value)} /></div>
          <div><Label className="text-xs">Descrição</Label><Input value={(d.description as string) || ''} onChange={e => updateData(idx, 'description', e.target.value)} /></div>
          <div><Label className="text-xs">Texto do Botão</Label><Input value={(d.button_text as string) || ''} onChange={e => updateData(idx, 'button_text', e.target.value)} /></div>
          <div><Label className="text-xs">URL do Botão</Label><Input value={(d.button_url as string) || ''} onChange={e => updateData(idx, 'button_url', e.target.value)} /></div>
        </div>
      );

    case 'faq': {
      const items = (Array.isArray(d.items) ? d.items : []) as { question: string; answer: string }[];
      const updateItems = (newItems: { question: string; answer: string }[]) => updateData(idx, 'items', newItems);
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2 p-3 rounded bg-muted/30">
              <div><Label className="text-xs">Pergunta</Label><Input value={item.question} onChange={e => { const c = [...items]; c[i] = { ...c[i], question: e.target.value }; updateItems(c); }} /></div>
              <div className="flex gap-2 items-end">
                <div className="flex-1"><Label className="text-xs">Resposta</Label><Input value={item.answer} onChange={e => { const c = [...items]; c[i] = { ...c[i], answer: e.target.value }; updateItems(c); }} /></div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => updateItems([...items, { question: '', answer: '' }])}>
            <Plus className="mr-1 h-3 w-3" />Pergunta
          </Button>
        </div>
      );
    }

    case 'cards': {
      const items = (Array.isArray(d.items) ? d.items : []) as { title: string; description: string; image_url: string }[];
      const updateItems = (newItems: typeof items) => updateData(idx, 'items', newItems);
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3 p-3 rounded bg-muted/30">
              <div><Label className="text-xs">Título</Label><Input value={item.title} onChange={e => { const c = [...items]; c[i] = { ...c[i], title: e.target.value }; updateItems(c); }} /></div>
              <div><Label className="text-xs">Descrição</Label><Input value={item.description} onChange={e => { const c = [...items]; c[i] = { ...c[i], description: e.target.value }; updateItems(c); }} /></div>
              <div className="flex gap-2 items-end">
                <div className="flex-1"><Label className="text-xs">Imagem URL</Label><Input value={item.image_url} onChange={e => { const c = [...items]; c[i] = { ...c[i], image_url: e.target.value }; updateItems(c); }} /></div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => updateItems([...items, { title: '', description: '', image_url: '' }])}>
            <Plus className="mr-1 h-3 w-3" />Card
          </Button>
        </div>
      );
    }

    case 'gallery': {
      const images = (Array.isArray(d.images) ? d.images : []) as { url: string; alt: string }[];
      const updateImages = (newImages: typeof images) => updateData(idx, 'images', newImages);
      return (
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={i} className="flex gap-2 items-end p-3 rounded bg-muted/30">
              <div className="flex-1"><Label className="text-xs">URL</Label><Input value={img.url} onChange={e => { const c = [...images]; c[i] = { ...c[i], url: e.target.value }; updateImages(c); }} /></div>
              <div className="flex-1"><Label className="text-xs">Alt</Label><Input value={img.alt} onChange={e => { const c = [...images]; c[i] = { ...c[i], alt: e.target.value }; updateImages(c); }} /></div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateImages(images.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => updateImages([...images, { url: '', alt: '' }])}>
            <Plus className="mr-1 h-3 w-3" />Imagem
          </Button>
        </div>
      );
    }

    default:
      return <p className="text-sm text-muted-foreground">Editor não disponível para tipo "{section.type}".</p>;
  }
};

export default CmsPageEditor;
