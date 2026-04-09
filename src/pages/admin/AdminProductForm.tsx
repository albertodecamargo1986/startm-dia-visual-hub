import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Category } from '@/types';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'novo';
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', slug: '', short_description: '', description: '', base_price: '0', price_unit: 'unidade',
    min_quantity: '1', thumbnail: '', category_id: '', tags: '', active: true, featured: false,
    needs_artwork: true, has_custom_size: false, production_days: '3', weight_g: '100',
    meta_title: '', meta_description: '', prod_order: '0',
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
      min_quantity: String(product.min_quantity), thumbnail: product.thumbnail ?? '', category_id: product.category_id ?? '',
      tags: (product.tags ?? []).join(', '), active: product.active ?? true, featured: product.featured ?? false,
      needs_artwork: product.needs_artwork ?? true, has_custom_size: product.has_custom_size ?? false,
      production_days: String(product.production_days), weight_g: String(product.weight_g),
      meta_title: product.meta_title ?? '', meta_description: product.meta_description ?? '', prod_order: String(product.prod_order),
    });
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      short_description: form.short_description, description: form.description,
      base_price: parseFloat(form.base_price) || 0, price_unit: form.price_unit, min_quantity: parseInt(form.min_quantity) || 1,
      thumbnail: form.thumbnail, category_id: form.category_id || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      active: form.active, featured: form.featured, needs_artwork: form.needs_artwork, has_custom_size: form.has_custom_size,
      production_days: parseInt(form.production_days) || 3, weight_g: parseInt(form.weight_g) || 100,
      meta_title: form.meta_title, meta_description: form.meta_description, prod_order: parseInt(form.prod_order) || 0,
    };

    const { error } = isNew
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', id!);

    if (error) toast.error(error.message);
    else { toast.success(isNew ? 'Produto criado!' : 'Produto atualizado!'); navigate('/admin/produtos'); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">{isNew ? 'Novo Produto' : 'Editar Produto'}</h2>
      <Card className="p-6 bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm text-muted-foreground block mb-1">Nome *</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">Slug</label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-gerado" /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">Categoria</label>
              <Select value={form.category_id} onValueChange={val => setForm(p => ({ ...p, category_id: val }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm text-muted-foreground block mb-1">Preço Base (R$)</label><Input type="number" step="0.01" value={form.base_price} onChange={e => setForm(p => ({ ...p, base_price: e.target.value }))} /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">Unidade de preço</label><Input value={form.price_unit} onChange={e => setForm(p => ({ ...p, price_unit: e.target.value }))} /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">Qtd mínima</label><Input type="number" value={form.min_quantity} onChange={e => setForm(p => ({ ...p, min_quantity: e.target.value }))} /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">Prazo (dias)</label><Input type="number" value={form.production_days} onChange={e => setForm(p => ({ ...p, production_days: e.target.value }))} /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">Thumbnail URL</label><Input value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))} /></div>
          </div>
          <div><label className="text-sm text-muted-foreground block mb-1">Descrição curta</label><Input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Descrição completa</label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Tags (separadas por vírgula)</label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} /></div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />Ativo</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={v => setForm(p => ({ ...p, featured: v }))} />Destaque</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.needs_artwork} onCheckedChange={v => setForm(p => ({ ...p, needs_artwork: v }))} />Precisa de arte</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.has_custom_size} onCheckedChange={v => setForm(p => ({ ...p, has_custom_size: v }))} />Tamanho personalizado</label>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/produtos')}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminProductForm;
