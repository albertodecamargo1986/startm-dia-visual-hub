import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useBlocker } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cmsApi } from '@/lib/cms-api';
import { BLOCK_TYPES, defaultBlockData, validateBlock } from '@/lib/cms-block-schemas';
import { BlockEditor } from '@/components/admin/cms/BlockEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Save, Globe, Eye, History, Loader2, Plus, Trash2, Copy,
  GripVertical, ChevronUp, ChevronDown, ChevronRight, AlertCircle,
  HelpCircle, EyeOff, Timer, TimerOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Section {
  id?: string;
  type: string;
  name: string;
  sort_order: number;
  enabled: boolean;
  data: Record<string, unknown>;
  _open?: boolean;
}

const AUTO_SAVE_INTERVAL = 15_000;

const CmsPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [page, setPage] = useState({ title: '', slug: '', seo_title: '', seo_description: '', is_home: false, status: 'draft' });
  const [sections, setSections] = useState<Section[]>([]);
  const [errors, setErrors] = useState<Record<number, string[]>>({});

  // Dirty tracking
  const [dirty, setDirty] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataInitialized = useRef(false);

  // Block unsaved navigation
  const blocker = useBlocker(dirty);

  // Warn on browser close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

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
      dataInitialized.current = false;
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
        _open: true,
      })));
      setTimeout(() => { dataInitialized.current = true; }, 100);
    }
  }, [sectionsData]);

  // Mark dirty on any change after init
  const markDirty = useCallback(() => {
    if (dataInitialized.current) setDirty(true);
  }, []);

  const setPageField = useCallback((updater: (p: typeof page) => typeof page) => {
    setPage(p => { const next = updater(p); markDirty(); return next; });
  }, [markDirty]);

  const setSectionsWrapped = useCallback((updater: (prev: Section[]) => Section[]) => {
    setSections(prev => { const next = updater(prev); markDirty(); return next; });
  }, [markDirty]);

  // Auto-save
  useEffect(() => {
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    if (autoSaveEnabled) {
      autoSaveTimer.current = setInterval(() => {
        if (dirty) {
          performSave(true);
        }
      }, AUTO_SAVE_INTERVAL);
    }
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveEnabled, dirty, page, sections]);

  const validateAll = useCallback((): boolean => {
    const errs: Record<number, string[]> = {};
    let valid = true;
    sections.forEach((s, i) => {
      const result = validateBlock(s.type, s.data);
      if (!result.valid) { errs[i] = result.errors; valid = false; }
    });
    setErrors(errs);
    return valid;
  }, [sections]);

  const buildPayload = useCallback(() => sections.map((s, i) => ({
    ...(s.id ? { id: s.id } : {}),
    type: s.type,
    name: s.name,
    sort_order: i,
    enabled: s.enabled,
    data: s.data,
  })), [sections]);

  const performSave = useCallback(async (isAutoSave = false) => {
    if (!validateAll()) {
      if (!isAutoSave) toast.error('Corrija os erros de validação antes de salvar');
      return;
    }
    setSaving(true);
    try {
      const res = await cmsApi.saveDraft({ id, ...page }, buildPayload());
      if (res.success) {
        setDirty(false);
        if (isAutoSave) {
          setLastAutoSave(new Date());
        } else {
          toast.success('Rascunho salvo!');
        }
        qc.invalidateQueries({ queryKey: ['cms-page', id] });
        qc.invalidateQueries({ queryKey: ['cms-sections', id] });
      } else if (!isAutoSave) {
        toast.error(res.error || 'Erro ao salvar');
      }
    } catch {
      if (!isAutoSave) toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }, [id, page, buildPayload, qc, validateAll]);

  const handleSave = useCallback(() => performSave(false), [performSave]);

  const handlePublish = async () => {
    if (!validateAll()) { toast.error('Corrija os erros antes de publicar'); return; }
    setPublishing(true);
    try {
      const saveRes = await cmsApi.saveDraft({ id, ...page }, buildPayload());
      if (!saveRes.success) { toast.error(saveRes.error || 'Erro ao salvar'); return; }
      const res = await cmsApi.publish(id!);
      if (res.success) {
        toast.success('Página publicada!');
        setPage(p => ({ ...p, status: 'published' }));
        setDirty(false);
        qc.invalidateQueries({ queryKey: ['cms-page', id] });
      } else {
        toast.error(res.error || 'Erro ao publicar');
      }
    } finally {
      setPublishing(false);
    }
  };

  const addSection = (type: string) => {
    const label = BLOCK_TYPES.find(t => t.value === type)?.label || type;
    setSectionsWrapped(prev => [...prev, {
      type,
      name: label,
      sort_order: prev.length,
      enabled: true,
      data: structuredClone(defaultBlockData[type] || {}),
      _open: true,
    }]);
  };

  const cloneSection = (idx: number) => {
    setSectionsWrapped(prev => {
      const src = prev[idx];
      const copy = [...prev];
      copy.splice(idx + 1, 0, {
        ...structuredClone(src),
        id: undefined,
        name: `${src.name} (cópia)`,
        _open: true,
      });
      return copy;
    });
  };

  const removeSection = (idx: number) => setSectionsWrapped(prev => prev.filter((_, i) => i !== idx));

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    setSectionsWrapped(prev => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const updateSectionData = (idx: number, key: string, value: unknown) => {
    setSectionsWrapped(prev => prev.map((s, i) => i === idx ? { ...s, data: { ...s.data, [key]: value } } : s));
    if (errors[idx]) setErrors(prev => { const c = { ...prev }; delete c[idx]; return c; });
  };

  const toggleSection = (idx: number) => setSectionsWrapped(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  const toggleOpen = (idx: number) => setSections(prev => prev.map((s, i) => i === idx ? { ...s, _open: !s._open } : s));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <TooltipProvider delayDuration={300}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/admin/cms"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <h1 className="font-display text-2xl">{page.title || 'Editor'}</h1>
            <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
              {page.status === 'published' ? 'Publicada' : 'Rascunho'}
            </Badge>
            {dirty && <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">Alterações não salvas</Badge>}
          </div>
          <div className="flex gap-2 items-center">
            {/* Auto-save toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={autoSaveEnabled ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setAutoSaveEnabled(v => !v)}
                >
                  {autoSaveEnabled ? <Timer className="h-4 w-4" /> : <TimerOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {autoSaveEnabled ? 'Auto-save ativado (15s)' : 'Auto-save desativado'}
                {lastAutoSave && autoSaveEnabled && (
                  <span className="block text-xs text-muted-foreground">Último: {lastAutoSave.toLocaleTimeString()}</span>
                )}
              </TooltipContent>
            </Tooltip>

            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/cms/${id}/revisoes`}><History className="mr-2 h-4 w-4" />Revisões</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`/p/${page.slug}`, '_blank')}>
              <Eye className="mr-2 h-4 w-4" />Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishing || !isSuperAdmin} title={!isSuperAdmin ? 'Apenas super_admin pode publicar' : ''}>
              {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}Publicar
            </Button>
          </div>
        </div>

        {/* Auto-save indicator */}
        {autoSaveEnabled && lastAutoSave && (
          <p className="text-xs text-muted-foreground mb-3">
            ✓ Auto-save: último salvamento às {lastAutoSave.toLocaleTimeString()}
          </p>
        )}

        <Tabs defaultValue="content">
          <TabsList className="mb-4">
            <TabsTrigger value="content">Conteúdo ({sections.length} blocos)</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="p-6 border-border max-w-2xl space-y-4">
              <FieldWithHelp label="Título" help="Nome da página exibido no cabeçalho e no menu de navegação.">
                <Input value={page.title} onChange={e => setPageField(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Sobre Nós" />
              </FieldWithHelp>
              <FieldWithHelp label="Slug" help="Endereço da página na URL. Use apenas letras minúsculas, números e hífens.">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">/p/</span>
                  <Input value={page.slug} onChange={e => setPageField(p => ({ ...p, slug: e.target.value }))} placeholder="sobre-nos" />
                </div>
              </FieldWithHelp>
              <FieldWithHelp label="SEO Title" help="Título exibido nos resultados de busca do Google. Recomendado: até 60 caracteres.">
                <Input value={page.seo_title} onChange={e => setPageField(p => ({ ...p, seo_title: e.target.value }))} placeholder={page.title || 'Título para mecanismos de busca'} />
                <p className="text-xs text-muted-foreground mt-1">{page.seo_title.length}/60</p>
              </FieldWithHelp>
              <FieldWithHelp label="SEO Description" help="Descrição exibida nos resultados de busca. Recomendado: até 160 caracteres.">
                <Textarea value={page.seo_description} onChange={e => setPageField(p => ({ ...p, seo_description: e.target.value }))} rows={2} placeholder="Uma breve descrição da página para os mecanismos de busca..." />
                <p className="text-xs text-muted-foreground mt-1">{page.seo_description.length}/160</p>
              </FieldWithHelp>
              <div className="flex items-center gap-2">
                <Switch checked={page.is_home} onCheckedChange={v => setPageField(p => ({ ...p, is_home: v }))} />
                <Label>Página inicial (Home)</Label>
                <HelpIcon text="Marque para que esta página seja carregada como página inicial do site." />
              </div>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="space-y-3">
              {sections.map((section, idx) => {
                const blockMeta = BLOCK_TYPES.find(t => t.value === section.type);
                const sectionErrors = errors[idx];

                return (
                  <Card key={section.id || `new-${idx}`} className={`border-border ${!section.enabled ? 'opacity-50' : ''} ${sectionErrors ? 'border-destructive' : ''}`}>
                    <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => toggleOpen(idx)}>
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${section._open ? 'rotate-90' : ''}`} />
                      <span className="text-sm">{blockMeta?.icon}</span>
                      <Badge variant="outline" className="text-xs">{blockMeta?.label || section.type}</Badge>
                      <span className="text-sm font-medium truncate">{section.name}</span>
                      {!section.enabled && <Badge variant="secondary" className="text-xs gap-1"><EyeOff className="h-3 w-3" />Oculto</Badge>}
                      {sectionErrors && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}

                      <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSection(idx)}>
                              {section.enabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{section.enabled ? 'Ocultar bloco (não será exibido na página)' : 'Mostrar bloco'}</TooltipContent>
                        </Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, -1)} disabled={idx === 0}><ChevronUp className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Mover para cima</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}><ChevronDown className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Mover para baixo</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cloneSection(idx)}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Duplicar bloco</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSection(idx)}><Trash2 className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Remover bloco</TooltipContent></Tooltip>
                      </div>
                    </div>

                    {section._open && (
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        <div className="mb-3">
                          <Label className="text-xs">Nome interno</Label>
                          <Input
                            value={section.name}
                            onChange={e => setSectionsWrapped(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                            className="h-7 text-sm max-w-64"
                            placeholder="Ex: Banner Principal"
                          />
                          <p className="text-xs text-muted-foreground mt-0.5">Visível apenas para você, ajuda a organizar os blocos.</p>
                        </div>

                        {sectionErrors && (
                          <div className="mb-3 p-2 rounded bg-destructive/10 text-destructive text-xs space-y-1">
                            {sectionErrors.map((err, i) => <p key={i}>• {err}</p>)}
                          </div>
                        )}

                        <BlockEditor type={section.type} data={section.data} onUpdate={(key, value) => updateSectionData(idx, key, value)} />
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* Add block */}
              <Card className="p-4 border-dashed border-border">
                <p className="text-sm text-muted-foreground mb-3">➕ Adicionar bloco:</p>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_TYPES.map(t => (
                    <Tooltip key={t.value}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => addSection(t.value)}>
                          <span className="mr-1">{t.icon}</span>{t.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{blockHelp[t.value] || t.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Navigation blocker dialog */}
        {blocker.state === 'blocked' && (
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
                <AlertDialogDescription>
                  Você tem alterações que não foram salvas. Deseja sair sem salvar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => blocker.reset?.()}>Continuar editando</AlertDialogCancel>
                <AlertDialogAction onClick={() => blocker.proceed?.()}>Sair sem salvar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  );
};

// Helper components
const FieldWithHelp = ({ label, help, children }: { label: string; help: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1">
      <Label>{label}</Label>
      <HelpIcon text={help} />
    </div>
    {children}
  </div>
);

const HelpIcon = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
  </Tooltip>
);

const blockHelp: Record<string, string> = {
  hero: 'Banner principal com título, subtítulo e imagem de fundo. Ideal para o topo da página.',
  rich_text: 'Bloco de texto livre com suporte a HTML/Markdown. Bom para conteúdo extenso.',
  image: 'Uma imagem com legenda e texto alternativo para acessibilidade.',
  cards: 'Grade de cards com título, descrição e imagem. Ideal para listar serviços ou produtos.',
  gallery: 'Galeria de imagens com legendas. Para portfólios e showcases.',
  faq: 'Lista de perguntas e respostas que expande ao clicar.',
  cta: 'Chamada para ação com botão. Direcione o visitante para uma ação específica.',
  spacer: 'Espaço vazio entre blocos para ajustar o layout.',
};

export default CmsPageEditor;
