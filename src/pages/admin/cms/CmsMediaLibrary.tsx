import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Upload, Trash2, Copy, Search, Loader2, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BUCKET = 'cms-media';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CmsMediaLibrary = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<{ id: string; alt: string } | null>(null);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['cms-media'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_media').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadMut = useMutation({
    mutationFn: async (files: FileList) => {
      const results: string[] = [];
      for (const file of Array.from(files)) {
        if (!ACCEPTED.includes(file.type)) { toast.error(`${file.name}: formato não suportado`); continue; }
        if (file.size > MAX_SIZE) { toast.error(`${file.name}: excede 5MB`); continue; }

        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (error) { toast.error(`${file.name}: erro no upload`); continue; }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

        // Get dimensions
        let width: number | null = null;
        let height: number | null = null;
        try {
          const dims = await getImageDimensions(urlData.publicUrl);
          width = dims.width;
          height = dims.height;
        } catch { /* ignore */ }

        await supabase.from('cms_media').insert({
          path,
          url: urlData.publicUrl,
          alt: file.name.replace(/\.[^.]+$/, ''),
          width,
          height,
          size_bytes: file.size,
          mime_type: file.type,
        });

        results.push(file.name);
      }
      return results;
    },
    onSuccess: (names) => {
      if (names.length) toast.success(`${names.length} arquivo(s) enviado(s)`);
      qc.invalidateQueries({ queryKey: ['cms-media'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const item = media.find(m => m.id === id);
      if (!item) return;
      await supabase.storage.from(BUCKET).remove([item.path]);
      const { error } = await supabase.from('cms_media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mídia excluída');
      qc.invalidateQueries({ queryKey: ['cms-media'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  const updateAltMut = useMutation({
    mutationFn: async ({ id, alt }: { id: string; alt: string }) => {
      const { error } = await supabase.from('cms_media').update({ alt }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alt atualizado');
      qc.invalidateQueries({ queryKey: ['cms-media'] });
      setEditingAlt(null);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    await uploadMut.mutateAsync(e.target.files);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  const filtered = media.filter(m =>
    (m.alt || '').toLowerCase().includes(search.toLowerCase()) ||
    m.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl">Biblioteca de Mídia</h1>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload
        </Button>
        <input ref={fileRef} type="file" accept={ACCEPTED.join(',')} multiple className="hidden" onChange={handleUpload} />
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou alt..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-border">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma mídia encontrada. Faça upload para começar.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => (
            <Card key={item.id} className="border-border overflow-hidden group">
              <div className="aspect-square bg-muted relative">
                <img src={item.url} alt={item.alt || ''} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => copyUrl(item.url)}><Copy className="h-3 w-3" /></Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteId(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium truncate" title={item.alt || item.path}>{item.alt || item.path}</p>
                <div className="flex gap-1 flex-wrap">
                  {item.width && item.height && <Badge variant="outline" className="text-[10px]">{item.width}×{item.height}</Badge>}
                  {item.size_bytes && <Badge variant="outline" className="text-[10px]">{formatBytes(Number(item.size_bytes))}</Badge>}
                </div>
                <button className="text-[10px] text-primary hover:underline" onClick={() => setEditingAlt({ id: item.id, alt: item.alt || '' })}>
                  Editar alt
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mídia?</AlertDialogTitle>
            <AlertDialogDescription>O arquivo será removido permanentemente do storage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit alt dialog */}
      <AlertDialog open={!!editingAlt} onOpenChange={() => setEditingAlt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Texto alternativo</AlertDialogTitle>
          </AlertDialogHeader>
          <Input value={editingAlt?.alt || ''} onChange={e => setEditingAlt(prev => prev ? { ...prev, alt: e.target.value } : null)} placeholder="Descrição da imagem" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => editingAlt && updateAltMut.mutate(editingAlt)}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

export default CmsMediaLibrary;
