import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cmsApi } from '@/lib/cms-api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Eye, Pencil, Copy, Trash2, Globe, GlobeLock, Loader2, Search, RotateCcw, History } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'default' },
  archived: { label: 'Arquivada', variant: 'outline' },
};

const actionLabels: Record<string, string> = {
  save_draft: 'Salvar rascunho',
  publish: 'Publicar',
  unpublish: 'Despublicar',
  duplicate: 'Duplicar',
  soft_delete: 'Excluir',
  restore: 'Restaurar',
  restore_revision: 'Restaurar revisão',
};

const CmsPageList = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pages');

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['cms-pages', statusFilter],
    queryFn: async () => {
      let q = supabase.from('cms_pages').select('*').is('deleted_at', null).order('updated_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: deletedPages = [] } = useQuery({
    queryKey: ['cms-pages-deleted'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'trash',
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['cms-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'audit',
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

  const softDeleteMut = useMutation({
    mutationFn: (id: string) => cmsApi.softDelete(id),
    onSuccess: (res) => {
      if (res.success) { toast.success('Página movida para lixeira'); qc.invalidateQueries({ queryKey: ['cms-pages'] }); qc.invalidateQueries({ queryKey: ['cms-pages-deleted'] }); }
      else toast.error(res.error || 'Erro');
      setDeleteId(null);
    },
  });

  const restorePageMut = useMutation({
    mutationFn: (id: string) => cmsApi.restorePage(id),
    onSuccess: (res) => {
      if (res.success) { toast.success('Página restaurada'); qc.invalidateQueries({ queryKey: ['cms-pages'] }); qc.invalidateQueries({ queryKey: ['cms-pages-deleted'] }); }
      else toast.error(res.error || 'Erro');
    },
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="trash">Lixeira</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        {/* Pages tab */}
        <TabsContent value="pages">
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
                            <DropdownMenuSeparator />
                            {p.status !== 'published' ? (
                              <DropdownMenuItem onClick={() => publishMut.mutate(p.id)} disabled={!isSuperAdmin}>
                                <Globe className="mr-2 h-4 w-4" />Publicar {!isSuperAdmin && '(super_admin)'}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => unpublishMut.mutate(p.id)} disabled={!isSuperAdmin}>
                                <GlobeLock className="mr-2 h-4 w-4" />Despublicar {!isSuperAdmin && '(super_admin)'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => duplicateMut.mutate({ id: p.id, slug: p.slug, title: p.title })}>
                              <Copy className="mr-2 h-4 w-4" />Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />Mover para lixeira
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
        </TabsContent>

        {/* Trash tab */}
        <TabsContent value="trash">
          {deletedPages.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Lixeira vazia.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Excluído em</TableHead>
                  <TableHead className="w-24">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedPages.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">/{p.slug}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.deleted_at && format(new Date(p.deleted_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => restorePageMut.mutate(p.id)} disabled={!isSuperAdmin}>
                        <RotateCcw className="mr-1 h-3 w-3" />Restaurar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Audit tab */}
        <TabsContent value="audit">
          {auditLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Nenhum registro de auditoria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{actionLabels[log.action] || log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.entity_type} · <span className="font-mono text-xs">{log.entity_id.slice(0, 8)}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para lixeira?</AlertDialogTitle>
            <AlertDialogDescription>A página será arquivada e poderá ser restaurada por um super_admin.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && softDeleteMut.mutate(deleteId)}>Mover para lixeira</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CmsPageList;
