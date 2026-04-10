import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const CmsPageCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', seo_title: '', seo_description: '' });

  const slugify = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: slugify(title) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) { toast.error('Título e slug são obrigatórios'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('cms_pages').insert({
        title: form.title,
        slug: form.slug,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        status: 'draft',
      }).select('id').single();
      if (error) throw error;
      toast.success('Página criada!');
      navigate(`/admin/cms/${data.id}`);
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
        <Button variant="ghost" size="icon" asChild><Link to="/admin/cms"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-3xl">Nova Página</h1>
      </div>
      <Card className="p-6 border-border max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Ex: Termos de Uso" />
          </div>
          <div>
            <Label>Slug *</Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm">/p/</span>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="termos-de-uso" />
            </div>
          </div>
          <div>
            <Label>SEO Title</Label>
            <Input value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} placeholder="Título para busca" />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} rows={2} placeholder="Descrição meta" />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar e Editar
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default CmsPageCreate;
