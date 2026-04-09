import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Category } from '@/types';

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', slug: '', icon: '' });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('cat_order'); return (data ?? []) as Category[]; },
  });

  const addCategory = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await supabase.from('categories').insert({ name: form.name, slug, icon: form.icon, cat_order: (categories?.length ?? 0) + 1 });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Categoria adicionada!'); setForm({ name: '', slug: '', icon: '' }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => { await supabase.from('categories').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Categoria removida!'); },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Categorias</h2>
      <Card className="p-4 bg-card border-border">
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="flex-1 min-w-[150px]" />
          <Input placeholder="Slug" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="w-40" />
          <Input placeholder="Ícone (Lucide)" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="w-40" />
          <Button onClick={() => addCategory.mutate()} disabled={!form.name}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
      </Card>
      {categories?.map(c => (
        <Card key={c.id} className="p-4 bg-card border-border flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{c.name}</p>
            <p className="text-xs text-muted-foreground">/{c.slug} · Ícone: {c.icon || 'nenhum'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => deleteCategory.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </Card>
      ))}
    </div>
  );
};

export default AdminCategories;
