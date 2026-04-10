import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Save, Globe, Eye, History, Loader2, Plus, Trash2, Copy, GripVertical, ChevronUp, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
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

const CmsPageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [page, setPage] = useState({ title: '', slug: '', seo_title: '', seo_description: '', is_home: false, status: 'draft' });
  const [sections, setSections] = useState<Section[]>([]);
  const [errors, setErrors] = useState<Record<number, string[]>>({});

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
        _open: true,
      })));
    }
  }, [sectionsData]);

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

  const buildPayload = () => sections.map((s, i) => ({
    ...(s.id ? { id: s.id } : {}),
    type: s.type,
    name: s.name,
    sort_order: i,
    enabled: s.enabled,
    data: s.data,
  }));

  const handleSave = useCallback(async () => {
    if (!validateAll()) { toast.error('Corrija os erros de validação antes de salvar'); return; }
    setSaving(true);
    try {
      const res = await cmsApi.saveDraft({ id, ...page }, buildPayload());
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
  }, [id, page, sections, qc, validateAll]);

  const handlePublish = async () => {
    if (!validateAll()) { toast.error('Corrija os erros antes de publicar'); return; }
    setPublishing(true);
    try {
      // save first
      const saveRes = await cmsApi.saveDraft({ id, ...page }, buildPayload());
      if (!saveRes.success) { toast.error(saveRes.error || 'Erro ao salvar'); return; }
      const res = await cmsApi.publish(id!);
      if (res.success) {
        toast.success('Página publicada!');
        setPage(p => ({ ...p, status: 'published' }));
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
    setSections(prev => [...prev, {
      type,
      name: label,
      sort_order: prev.length,
      enabled: true,
      data: structuredClone(defaultBlockData[type] || {}),
      _open: true,
    }]);
  };

  const cloneSection = (idx: number) => {
    const src = sections[idx];
    setSections(prev => {
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

  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx));

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
    // Clear errors for this section on edit
    if (errors[idx]) setErrors(prev => { const c = { ...prev }; delete c[idx]; return c; });
  };

  const toggleSection = (idx: number) => setSections(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  const toggleOpen = (idx: number) => setSections(prev => prev.map((s, i) => i === idx ? { ...s, _open: !s._open } : s));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      {/* Header */}
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
          <TabsTrigger value="content">Conteúdo ({sections.length} blocos)</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="p-6 border-border max-w-2xl space-y-4">
            <div><Label>Título</Label><Input value={page.title} onChange={e => setPage(p => ({ ...p, title: e.target.value }))} /></div>
            <div>
              <Label>Slug</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">/p/</span>
                <Input value={page.slug} onChange={e => setPage(p => ({ ...p, slug: e.target.value }))} />
              </div>
            </div>
            <div><Label>SEO Title</Label><Input value={page.seo_title} onChange={e => setPage(p => ({ ...p, seo_title: e.target.value }))} /></div>
            <div><Label>SEO Description</Label><Textarea value={page.seo_description} onChange={e => setPage(p => ({ ...p, seo_description: e.target.value }))} rows={2} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={page.is_home} onCheckedChange={v => setPage(p => ({ ...p, is_home: v }))} />
              <Label>Página inicial (Home)</Label>
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
                  {/* Section header - always visible */}
                  <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => toggleOpen(idx)}>
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${section._open ? 'rotate-90' : ''}`} />
                    <span className="text-sm">{blockMeta?.icon}</span>
                    <Badge variant="outline" className="text-xs">{blockMeta?.label || section.type}</Badge>
                    <span className="text-sm font-medium truncate">{section.name}</span>
                    {sectionErrors && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}

                    <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Switch checked={section.enabled} onCheckedChange={() => toggleSection(idx)} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, -1)} disabled={idx === 0}><ChevronUp className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cloneSection(idx)}><Copy className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSection(idx)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>

                  {/* Section body - collapsible */}
                  {section._open && (
                    <div className="px-4 pb-4 pt-1 border-t border-border">
                      <div className="mb-3">
                        <Label className="text-xs">Nome interno</Label>
                        <Input value={section.name} onChange={e => setSections(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))} className="h-7 text-sm max-w-64" />
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
              <p className="text-sm text-muted-foreground mb-3">Adicionar bloco:</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map(t => (
                  <Button key={t.value} variant="outline" size="sm" onClick={() => addSection(t.value)}>
                    <span className="mr-1">{t.icon}</span>{t.label}
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

export default CmsPageEditor;
