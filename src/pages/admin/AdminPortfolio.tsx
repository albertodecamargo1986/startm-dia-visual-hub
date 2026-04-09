import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageUploadWithEditor } from '@/components/ui/image-upload-with-editor';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string | null;
  image_url: string;
  active: boolean | null;
  item_order: number | null;
}

const emptyForm = { title: '', category: '', description: '', image_url: '', active: true, item_order: 0 };

const AdminPortfolio = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-portfolio'],
    queryFn: async () => {
      const { data } = await supabase.from('portfolio_items').select('*').order('item_order');
      return (data ?? []) as PortfolioItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = form.image_url;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'png';
        const path = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('banners').upload(path, imageFile);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('banners').getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      if (!imageUrl) throw new Error('Imagem é obrigatória');

      const payload = {
        title: form.title,
        category: form.category,
        description: form.description || null,
        image_url: imageUrl,
        active: form.active,
        item_order: form.item_order,
      };

      if (editingId) {
        const { error } = await supabase.from('portfolio_items').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('portfolio_items').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portfolio'] });
      toast.success(editingId ? 'Item atualizado!' : 'Item adicionado!');
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portfolio'] });
      toast.success('Item excluído!');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      await supabase.from('portfolio_items').update({ item_order: newOrder }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-portfolio'] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      description: item.description ?? '',
      image_url: item.image_url,
      active: item.active ?? true,
      item_order: item.item_order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSwapOrder = (index: number, direction: 'up' | 'down') => {
    if (!items) return;
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[index];
    const b = items[swapIdx];
    reorderMutation.mutate({ id: a.id, newOrder: b.item_order ?? 0 });
    reorderMutation.mutate({ id: b.id, newOrder: a.item_order ?? 0 });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Portfólio</h1>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Item
        </Button>
      </div>

      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Imagem</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-20">Ordem</TableHead>
              <TableHead className="w-20">Ativo</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !items?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum item no portfólio</TableCell></TableRow>
            ) : items.map((item, i) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell className="text-muted-foreground">{item.category}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button onClick={() => handleSwapOrder(i, 'up')} disabled={i === 0} className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => handleSwapOrder(i, 'down')} disabled={i === items.length - 1} className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${item.active ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {item.active ? 'Sim' : 'Não'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(item.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Item' : 'Novo Item do Portfólio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título *</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria *</label>
              <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Ex: Fachadas, Adesivos..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Imagem *</label>
              <ImageUploadWithEditor
                currentUrl={form.image_url || undefined}
                onImageReady={(file) => setImageFile(file)}
                className="h-48"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Ordem</label>
                <Input type="number" value={form.item_order} onChange={e => setForm(p => ({ ...p, item_order: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
                <span className="text-sm">Ativo</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title}>
              {saveMutation.isPending ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPortfolio;
