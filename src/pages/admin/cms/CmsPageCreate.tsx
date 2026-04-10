import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, ArrowRight, Check, FileText, Megaphone, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { PAGE_TYPES, PAGE_TEMPLATES, type PageType, type PageTemplate } from '@/lib/cms-templates';
import { cn } from '@/lib/utils';

const STEP_LABELS = ['Tipo', 'Título & Slug', 'Template', 'SEO', 'Criar'];

const typeIcons: Record<string, React.ReactNode> = {
  institutional: <FileText className="h-5 w-5" />,
  landing: <Rocket className="h-5 w-5" />,
  campaign: <Megaphone className="h-5 w-5" />,
};

const slugify = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CmsPageCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState('');

  const [pageType, setPageType] = useState<PageType>('institutional');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [templateId, setTemplateId] = useState('blank');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const progress = ((step + 1) / STEP_LABELS.length) * 100;

  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSlug(slugify(v));
    setSlugError('');
  };

  const validateSlug = async (): Promise<boolean> => {
    if (!slug.trim()) { setSlugError('Slug é obrigatório'); return false; }
    const { data } = await supabase.from('cms_pages').select('id').eq('slug', slug).maybeSingle();
    if (data) { setSlugError('Slug já existe'); return false; }
    setSlugError('');
    return true;
  };

  const canAdvance = (): boolean => {
    if (step === 1) return title.trim().length > 0 && slug.trim().length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      const ok = await validateSlug();
      if (!ok) return;
    }
    if (step < STEP_LABELS.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => { if (step > 0) setStep(s => s - 1); };

  const selectedTemplate = PAGE_TEMPLATES.find(t => t.id === templateId)!;

  const handleCreate = async () => {
    setSaving(true);
    try {
      // Create page
      const { data: page, error: pageErr } = await supabase.from('cms_pages').insert({
        title,
        slug,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        status: 'draft',
      }).select('id').single();
      if (pageErr) throw pageErr;

      // Insert template sections
      if (selectedTemplate.sections.length > 0) {
        const sections = selectedTemplate.sections.map((s, i) => ({
          page_id: page.id,
          type: s.type,
          name: s.name,
          sort_order: i,
          data: s.data as unknown as Record<string, never>,
          enabled: true,
        }));
        const { error: secErr } = await supabase.from('cms_sections').insert(sections);
        if (secErr) throw secErr;
      }

      toast.success('Página criada com sucesso!');
      navigate(`/admin/cms/${page.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar';
      toast.error(msg.includes('unique') ? 'Slug já existe' : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/cms"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="font-display text-3xl">Nova Página</h1>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          {STEP_LABELS.map((l, i) => (
            <span key={l} className={cn(i === step && 'text-primary font-semibold')}>{l}</span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="p-6 border-border max-w-2xl">
        {/* Step 0 – Page type */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Tipo de página</h2>
            <RadioGroup value={pageType} onValueChange={v => setPageType(v as PageType)} className="grid gap-3">
              {PAGE_TYPES.map(t => (
                <label
                  key={t.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                    pageType === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
                  )}
                >
                  <RadioGroupItem value={t.id} />
                  <div className="flex items-center gap-3 flex-1">
                    {typeIcons[t.id]}
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 1 – Title & Slug */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Título e Slug</h2>
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Ex: Termos de Uso" autoFocus />
            </div>
            <div>
              <Label>Slug *</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">/p/</span>
                <Input
                  value={slug}
                  onChange={e => { setSlug(e.target.value); setSlugError(''); }}
                  placeholder="termos-de-uso"
                />
              </div>
              {slugError && <p className="text-sm text-destructive mt-1">{slugError}</p>}
            </div>
          </div>
        )}

        {/* Step 2 – Template */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Template inicial</h2>
            <RadioGroup value={templateId} onValueChange={setTemplateId} className="grid gap-3 sm:grid-cols-2">
              {PAGE_TEMPLATES.map(t => (
                <label
                  key={t.id}
                  className={cn(
                    'flex flex-col gap-1 p-4 rounded-lg border cursor-pointer transition-colors',
                    templateId === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={t.id} />
                    <span className="font-medium">{t.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{t.description}</p>
                  {t.sections.length > 0 && (
                    <p className="text-xs text-muted-foreground pl-6">{t.sections.length} bloco(s): {t.sections.map(s => s.type).join(', ')}</p>
                  )}
                </label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 3 – SEO */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">SEO básico</h2>
            <p className="text-sm text-muted-foreground">Opcional. Você pode editar depois.</p>
            <div>
              <Label>SEO Title</Label>
              <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title || 'Título para busca'} />
              <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/60 caracteres</p>
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={3} placeholder="Descrição meta" />
              <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/160 caracteres</p>
            </div>
          </div>
        )}

        {/* Step 4 – Review & Create */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Resumo</h2>
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <p><span className="font-medium">Tipo:</span> {PAGE_TYPES.find(t => t.id === pageType)?.label}</p>
              <p><span className="font-medium">Título:</span> {title}</p>
              <p><span className="font-medium">Slug:</span> /p/{slug}</p>
              <p><span className="font-medium">Template:</span> {selectedTemplate.label} ({selectedTemplate.sections.length} blocos)</p>
              {seoTitle && <p><span className="font-medium">SEO Title:</span> {seoTitle}</p>}
              {seoDescription && <p><span className="font-medium">SEO Desc:</span> {seoDescription}</p>}
              <p><span className="font-medium">Status:</span> Rascunho</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>

          {step < STEP_LABELS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canAdvance()}>
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Criar e Editar
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CmsPageCreate;
