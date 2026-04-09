import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploadWithEditor } from '@/components/ui/image-upload-with-editor';
import { toast } from 'sonner';
import { X, Star, HelpCircle } from 'lucide-react';
import type { Category } from '@/types';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'novo';
  const [loading, setLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    name: '', slug: '', short_description: '', description: '', base_price: '0', price_unit: 'unidade',
    min_quantity: '1', category_id: '', active: true, featured: false,
    needs_artwork: true, has_custom_size: false, production_days: '3', weight_g: '100',
    meta_title: '', meta_description: '', prod_order: '0',
    images: [] as string[], thumbnail: '', tags: [] as string[],
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('cat_order'); return (data ?? []) as Category[]; },
  });

  const { data: product } = useQuery({
    queryKey: ['product-edit', id],
    queryFn: async () => { const { data } = await supabase.from('products').select('*').eq('id', id!).single(); return data; },
    enabled: !isNew,
  });

  useEffect(() => {
    if (product) setForm({
      name: product.name, slug: product.slug, short_description: product.short_description ?? '',
      description: product.description ?? '', base_price: String(product.base_price), price_unit: product.price_unit ?? 'unidade',
      min_quantity: String(product.min_quantity), category_id: product.category_id ?? '',
      active: product.active ?? true, featured: product.featured ?? false,
      needs_artwork: product.needs_artwork ?? true, has_custom_size: product.has_custom_size ?? false,
      production_days: String(product.production_days), weight_g: String(product.weight_g),
      meta_title: product.meta_title ?? '', meta_description: product.meta_description ?? '',
      prod_order: String(product.prod_order),
      images: product.images ?? [], thumbnail: product.thumbnail ?? '', tags: product.tags ?? [],
    });
  }, [product]);

  const handleImageReady = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo excede 5MB'); return; }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast.error('Erro no upload'); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    setForm(p => ({
      ...p,
      images: [...p.images, publicUrl],
      thumbnail: p.thumbnail || publicUrl,
    }));
    toast.success('Imagem enviada!');
  }, []);

  const removeImage = (url: string) => {
    setForm(p => ({
      ...p,
      images: p.images.filter(i => i !== url),
      thumbnail: p.thumbnail === url ? (p.images.filter(i => i !== url)[0] || '') : p.thumbnail,
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(p => ({ ...p, tags: [...p.tags, tag] }));
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      short_description: form.short_description, description: form.description,
      base_price: parseFloat(form.base_price) || 0, price_unit: form.price_unit,
      min_quantity: parseInt(form.min_quantity) || 1, category_id: form.category_id || null,
      active: form.active, featured: form.featured, needs_artwork: form.needs_artwork,
      has_custom_size: form.has_custom_size, production_days: parseInt(form.production_days) || 3,
      weight_g: parseInt(form.weight_g) || 100,
      meta_title: form.meta_title, meta_description: form.meta_description,
      prod_order: parseInt(form.prod_order) || 0,
      images: form.images, thumbnail: form.thumbnail, tags: form.tags,
    };

    const { error } = isNew
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', id!);

    if (error) toast.error(error.message);
    else { toast.success(isNew ? 'Produto criado!' : 'Produto atualizado!'); navigate('/admin/produtos'); }
    setLoading(false);
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">{isNew ? 'Novo Produto' : 'Editar Produto'}</h2>
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="basic">Informações</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="description">Descrição</TabsTrigger>
          </TabsList>

          {/* Tab Basic */}
          <TabsContent value="basic">
            <Card className="p-6 bg-card border-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Nome *</label>
                  <Input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value, slug: isNew ? autoSlug(e.target.value) : p.slug })); }} required />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Slug</label>
                  <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Categoria</label>
                  <Select value={form.category_id} onValueChange={val => setForm(p => ({ ...p, category_id: val }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Preço Base (R$)</label>
                  <Input type="number" step="0.01" value={form.base_price} onChange={e => setForm(p => ({ ...p, base_price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Unidade de preço</label>
                  <Input value={form.price_unit} onChange={e => setForm(p => ({ ...p, price_unit: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Qtd mínima</label>
                  <Input type="number" value={form.min_quantity} onChange={e => setForm(p => ({ ...p, min_quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Prazo (dias)</label>
                  <Input type="number" value={form.production_days} onChange={e => setForm(p => ({ ...p, production_days: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Peso (g)</label>
                  <Input type="number" value={form.weight_g} onChange={e => setForm(p => ({ ...p, weight_g: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Descrição curta <span className="text-xs">({form.short_description.length}/160)</span></label>
                <Input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value.slice(0, 160) }))} maxLength={160} />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />Ativo</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={v => setForm(p => ({ ...p, featured: v }))} />Destaque</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.needs_artwork} onCheckedChange={v => setForm(p => ({ ...p, needs_artwork: v }))} />Precisa de arte</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.has_custom_size} onCheckedChange={v => setForm(p => ({ ...p, has_custom_size: v }))} />Tamanho personalizado</label>
              </div>
            </Card>
          </TabsContent>

          {/* Tab Photos */}
          <TabsContent value="photos">
            <Card className="p-6 bg-card border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Fotos do Produto</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setHelpOpen(true)}><HelpCircle className="h-4 w-4 mr-1" />Ajuda</Button>
              </div>
              <ImageUploadWithEditor
                onImageReady={handleImageReady}
                aspectRatio={1}
                maxSizeMB={5}
                placeholder="Clique ou arraste para adicionar fotos do produto"
                className="h-40"
              />
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {form.images.map(url => (
                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" onClick={() => setForm(p => ({ ...p, thumbnail: url }))} className={`p-1 rounded ${form.thumbnail === url ? 'text-yellow-400' : 'text-white hover:text-yellow-400'}`}>
                          <Star className="h-5 w-5" fill={form.thumbnail === url ? 'currentColor' : 'none'} />
                        </button>
                        <button type="button" onClick={() => removeImage(url)} className="p-1 rounded text-white hover:text-red-400"><X className="h-5 w-5" /></button>
                      </div>
                      {form.thumbnail === url && <Badge className="absolute top-1 left-1 text-[10px] bg-yellow-500">Principal</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab SEO */}
          <TabsContent value="seo">
            <Card className="p-6 bg-card border-border space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Meta Title <span className="text-xs">({form.meta_title.length}/60)</span></label>
                <Input value={form.meta_title} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value.slice(0, 60) }))} maxLength={60} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Meta Description <span className="text-xs">({form.meta_description.length}/160)</span></label>
                <Textarea value={form.meta_description} onChange={e => setForm(p => ({ ...p, meta_description: e.target.value.slice(0, 160) }))} maxLength={160} rows={3} />
              </div>
              <div className="border border-border rounded-lg p-4 bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Preview no Google</p>
                <p className="text-blue-400 text-sm font-medium">{form.meta_title || form.name || 'Título do produto'}</p>
                <p className="text-green-400 text-xs">startmidia.com.br › produto › {form.slug || 'slug'}</p>
                <p className="text-xs text-muted-foreground mt-1">{form.meta_description || form.short_description || 'Descrição do produto...'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Tags</label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Adicionar tag..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                  <Button type="button" variant="outline" onClick={addTag}>Adicionar</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}>
                        {tag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Tab Description */}
          <TabsContent value="description">
            <Card className="p-6 bg-card border-border space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Descrição Completa</label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={10} placeholder="Suporta Markdown..." />
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/produtos')}>Cancelar</Button>
        </div>
      </form>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>📐 Guia de Imagens</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Tamanho mínimo recomendado: <strong>800×800px</strong></p>
            <p>• Proporção ideal: <strong>quadrada (1:1)</strong></p>
            <p>• Tamanho máximo por arquivo: <strong>5MB</strong></p>
            <p>• Formatos aceitos: <strong>JPG, PNG, WebP</strong></p>
            <p>• Use a estrela ⭐ para definir a imagem principal (thumbnail)</p>
            <p>• Ao enviar, você pode <strong>recortar e aplicar filtros</strong> na imagem</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductForm;
