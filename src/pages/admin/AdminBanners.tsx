import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUploadWithEditor } from '@/components/ui/image-upload-with-editor';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import type { Banner } from '@/types';

const emptyForm = { title: '', subtitle: '', image_url: '', link_url: '', button_text: '', active: true };

const AdminBanners = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: banners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => { const { data } = await supabase.from('banners').select('*').order('banner_order'); return (data ?? []) as Banner[]; },
  });

  const handleImageReady = useCallback(async (file: File) => {
    if (file.size > 3 * 1024 * 1024) { toast.error('Máximo 3MB'); return; }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('banners').upload(path, file);
    if (error) { toast.error('Erro no upload'); return; }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path);
    setForm(p => ({ ...p, image_url: publicUrl }));
    toast.success('Imagem do banner enviada!');
  }, []);

  const saveBanner = useMutation({
    mutationFn: async () => {
      if (editId) {
        await supabase.from('banners').update({ ...form }).eq('id', editId);
      } else {
        await supabase.from('banners').insert({ ...form, banner_order: (banners?.length ?? 0) + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(editId ? 'Banner atualizado!' : 'Banner adicionado!');
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('banners').update({ active }).eq('id', id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => { await supabase.from('banners').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Banner removido!'); },
  });

  const openEdit = (b: Banner) => {
    setEditId(b.id);
    setForm({ title: b.title ?? '', subtitle: b.subtitle ?? '', image_url: b.image_url, link_url: b.link_url ?? '', button_text: b.button_text ?? '', active: b.active ?? true });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Banners</h2>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Novo Banner</Button>
      </div>

      {banners?.map(b => (
        <Card key={b.id} className="p-4 bg-card border-border flex items-center gap-4">
          <div className="h-16 w-28 bg-muted rounded-md overflow-hidden flex-shrink-0">
            <img src={b.image_url} alt={b.title ?? ''} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{b.title || '(Sem título)'}</p>
            <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>
          </div>
          <Switch checked={b.active ?? true} onCheckedChange={v => toggleActive.mutate({ id: b.id, active: v })} />
          <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => deleteBanner.mutate(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Editar Banner' : 'Novo Banner'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">📐 Tamanho recomendado: 1920×600px · Proporção 16:5 · Máx 3MB · JPG/PNG/WebP</div>
            <ImageUploadWithEditor
              onImageReady={handleImageReady}
              currentUrl={form.image_url || undefined}
              aspectRatio={16 / 5}
              maxSizeMB={3}
              placeholder="Clique para enviar imagem do banner"
              className="h-40"
            />
            <Input placeholder="Título" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Subtítulo" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} />
            <Input placeholder="URL do Link (opcional)" value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} />
            <Input placeholder="Texto do Botão CTA (opcional)" value={form.button_text} onChange={e => setForm(p => ({ ...p, button_text: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveBanner.mutate()} disabled={!form.image_url}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
