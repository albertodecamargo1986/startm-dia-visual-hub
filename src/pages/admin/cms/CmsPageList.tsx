import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cmsApi } from '@/lib/cms-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Eye, Pencil, Copy, Trash2, Globe, GlobeLock, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'default' },
  archived: { label: 'Arquivada', variant: 'outline' },
};

const CmsPageList = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['cms-pages', statusFilter],
    queryFn: async () => {
      let q = supabase.from('cms_pages').select('*').order('updated_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => cmsApi.publish(id),
    onSuccess: (res) => {
      if (res.success) { toast.success('Página publicada'); qc.invalidateQueries({ queryKey: ['cms-pages'] }); }
      else toast.error(res.error || 'Erro ao publicar');
    },
  });

  const unpublishMut = useMutation({
    mutationFn: (id: string) => cmsApi.unpublish(id),
    onSuccess: (res) => {
      if (res.success) { toast.success('Página despublicada'); qc.invalidateQueries({ queryKey: ['cms-pages'] }); }
      else toast.error(res.error || 'Erro');
    },
  });

  const duplicateMut = useMutation({
    mutationFn: (page: { id: string; slug: string; title: string }) =>
      cmsApi.duplicate(page.id, `${page.slug}-copia`, `${page.title} (Cópia)`),
    onSuccess: (res) => {
      if (res.success) { toast.success('Página duplicada'); qc.invalidateQueries({ queryKey: ['cms-pages'] }); }
      else toast.error(res.error || 'Erro ao duplicar');
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cms_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Página excluída'); qc.invalidateQueries({ queryKey: ['cms-pages'] }); setDeleteId(null); },
    onError: () => toast.error('Erro ao excluir'),
  });

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">CMS — Páginas</h1>
        <Button asChild>
          <Link to="/admin/cms/nova"><Plus className="mr-2 h-4 w-4" />Nova Página</Link>
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título ou slug..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicada</SelectItem>
            <SelectItem value="archived">Arquivada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhuma página encontrada.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => {
              const sc = statusConfig[p.status] || statusConfig.draft;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/cms/${p.id}`} className="hover:underline">{p.title}</Link>
                    {p.is_home && <Badge variant="outline" className="ml-2 text-xs">Home</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">/{p.slug}</TableCell>
                  <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(p.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/cms/${p.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/p/${p.slug}`, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" />Preview
                        </DropdownMenuItem>
                        {p.status !== 'published' ? (
                          <DropdownMenuItem onClick={() => publishMut.mutate(p.id)}>
                            <Globe className="mr-2 h-4 w-4" />Publicar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => unpublishMut.mutate(p.id)}>
                            <GlobeLock className="mr-2 h-4 w-4" />Despublicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => duplicateMut.mutate({ id: p.id, slug: p.slug, title: p.title })}>
                          <Copy className="mr-2 h-4 w-4" />Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as seções e revisões serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CmsPageList;
