import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import type { Category } from '@/types';

const iconOptions = ['Sticker', 'Image', 'Flag', 'Tag', 'Box', 'Star', 'Layers', 'Palette', 'Printer', 'Car', 'Building', 'ShoppingBag'];

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', description: '' });
  const [editName, setEditName] = useState<Record<string, string>>({});

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('cat_order'); return (data ?? []) as Category[]; },
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (editId) {
        await supabase.from('categories').update({ name: form.name, slug, icon: form.icon, description: form.description }).eq('id', editId);
      } else {
        await supabase.from('categories').insert({ name: form.name, slug, icon: form.icon, description: form.description, cat_order: (categories?.length ?? 0) + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(editId ? 'Categoria atualizada!' : 'Categoria adicionada!');
      setDialogOpen(false);
      setForm({ name: '', slug: '', icon: '', description: '' });
      setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('categories').update({ active }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      if (!categories) return;
      const idx = categories.findIndex(c => c.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= categories.length) return;
      await supabase.from('categories').update({ cat_order: categories[swapIdx].cat_order }).eq('id', categories[idx].id);
      await supabase.from('categories').update({ cat_order: categories[idx].cat_order }).eq('id', categories[swapIdx].id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const updateName = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await supabase.from('categories').update({ name }).eq('id', id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Nome atualizado!'); },
  });

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setForm({ name: c.name, slug: c.slug, icon: c.icon ?? '', description: c.description ?? '' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Categorias</h2>
        <Button onClick={() => { setEditId(null); setForm({ name: '', slug: '', icon: '', description: '' }); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button>
      </div>

      {categories?.map((c, i) => (
        <Card key={c.id} className="p-4 bg-card border-border flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => reorder.mutate({ id: c.id, direction: 'up' })}><ChevronUp className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === (categories?.length ?? 0) - 1} onClick={() => reorder.mutate({ id: c.id, direction: 'down' })}><ChevronDown className="h-3 w-3" /></Button>
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={editName[c.id] ?? c.name}
              onChange={e => setEditName(p => ({ ...p, [c.id]: e.target.value }))}
              onBlur={() => { if (editName[c.id] && editName[c.id] !== c.name) updateName.mutate({ id: c.id, name: editName[c.id] }); }}
              className="bg-transparent border-none h-8 px-0 text-foreground font-semibold"
            />
            <p className="text-xs text-muted-foreground">/{c.slug} · Ícone: {c.icon || 'nenhum'}</p>
          </div>
          <Switch checked={c.active ?? true} onCheckedChange={v => toggleActive.mutate({ id: c.id, active: v })} />
          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Slug (auto-gerado)" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} />
            <Select value={form.icon} onValueChange={v => setForm(p => ({ ...p, icon: v }))}>
              <SelectTrigger><SelectValue placeholder="Ícone" /></SelectTrigger>
              <SelectContent>{iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveCategory.mutate()} disabled={!form.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
