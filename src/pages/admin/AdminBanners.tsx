import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Banner } from '@/types';

const AdminBanners = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '' });

  const { data: banners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => { const { data } = await supabase.from('banners').select('*').order('banner_order'); return (data ?? []) as Banner[]; },
  });

  const addBanner = useMutation({
    mutationFn: async () => {
      await supabase.from('banners').insert({ ...form, banner_order: (banners?.length ?? 0) + 1 });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Banner adicionado!'); setForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '' }); },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => { await supabase.from('banners').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Banner removido!'); },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Banners</h2>
      <Card className="p-4 bg-card border-border space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Título" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Input placeholder="Subtítulo" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} />
          <Input placeholder="URL da Imagem *" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} />
          <Input placeholder="URL do Link" value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} />
          <Input placeholder="Texto do Botão" value={form.button_text} onChange={e => setForm(p => ({ ...p, button_text: e.target.value }))} />
        </div>
        <Button onClick={() => addBanner.mutate()} disabled={!form.image_url}><Plus className="h-4 w-4 mr-1" />Adicionar Banner</Button>
      </Card>
      {banners?.map(b => (
        <Card key={b.id} className="p-4 bg-card border-border flex items-center gap-4">
          <div className="h-16 w-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
            <img src={b.image_url} alt={b.title ?? ''} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{b.title || '(Sem título)'}</p>
            <p className="text-xs text-muted-foreground">{b.subtitle}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => deleteBanner.mutate(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </Card>
      ))}
    </div>
  );
};

export default AdminBanners;
