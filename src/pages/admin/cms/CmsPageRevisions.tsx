import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cmsApi } from '@/lib/cms-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { Json } from '@/integrations/supabase/types';

const CmsPageRevisions = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const { data: page } = useQuery({
    queryKey: ['cms-page', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('title').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: revisions = [], isLoading } = useQuery({
    queryKey: ['cms-revisions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_page_revisions')
        .select('*')
        .eq('page_id', id!)
        .order('version', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const restoreMut = useMutation({
    mutationFn: async (revisionId: string) => {
      const res = await cmsApi.restoreRevision(id!, revisionId);
      if (!res.success) throw new Error(res.error || 'Erro');
    },
    onSuccess: () => {
      toast.success('Versão restaurada!');
      qc.invalidateQueries({ queryKey: ['cms-page', id] });
      qc.invalidateQueries({ queryKey: ['cms-sections', id] });
      setRestoreId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild><Link to={`/admin/cms/${id}`}><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-2xl">Revisões — {page?.title}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : revisions.length === 0 ? (
        <Card className="p-8 text-center border-border">
          <p className="text-muted-foreground">Nenhuma revisão encontrada. Publique a página para criar a primeira.</p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versão</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisions.map((rev, idx) => (
              <TableRow key={rev.id}>
                <TableCell>
                  <Badge variant={idx === 0 ? 'default' : 'outline'}>v{rev.version}</Badge>
                  {idx === 0 && <span className="ml-2 text-xs text-muted-foreground">(mais recente)</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(rev.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setRestoreId(rev.id)}>
                    <RotateCcw className="mr-1 h-3 w-3" />Restaurar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar versão?</AlertDialogTitle>
            <AlertDialogDescription>O conteúdo atual será substituído pelo snapshot desta revisão. A versão atual não será perdida se já foi publicada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => restoreId && restoreMut.mutate(restoreId)}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CmsPageRevisions;
