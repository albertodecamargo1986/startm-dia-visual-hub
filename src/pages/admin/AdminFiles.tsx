import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Download, Check, X, Eye } from 'lucide-react';
import type { CustomerFile } from '@/types';
import { formatDate } from '@/lib/format';
import { checkAndAdvanceOrder, recordArtRejection } from '@/lib/artwork-helpers';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  in_review: 'bg-blue-500/20 text-blue-400',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado', in_review: 'Em revisão',
};

const AdminFiles = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectId, setRejectId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const { data: files } = useQuery({
    queryKey: ['admin-files'],
    queryFn: async () => {
      const { data } = await supabase.from('customer_files').select('*, profiles(full_name, email)').order('uploaded_at', { ascending: false });
      return (data ?? []) as (CustomerFile & { profiles: { full_name: string; email: string } | null })[];
    },
  });

  const filtered = statusFilter === 'all' ? files : files?.filter(f => f.status === statusFilter);

  const approve = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('customer_files').update({ status: 'approved' }).eq('id', id);
      const file = files?.find(f => f.id === id);
      if (file?.order_item_id) {
        await supabase.from('order_items').update({ artwork_status: 'approved' }).eq('id', file.order_item_id);
        await checkAndAdvanceOrder(file.order_item_id);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-files'] }); toast.success('Arquivo aprovado!'); },
  });

  const reject = useMutation({
    mutationFn: async () => {
      await supabase.from('customer_files').update({ status: 'rejected', admin_comment: rejectReason }).eq('id', rejectId);
      const file = files?.find(f => f.id === rejectId);
      if (file?.order_item_id) {
        await supabase.from('order_items').update({ artwork_status: 'rejected' }).eq('id', file.order_item_id);
        await recordArtRejection(file.order_item_id, rejectReason);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-files'] }); toast.success('Arquivo rejeitado.'); setRejectOpen(false); setRejectReason(''); },
  });

  const handleDownload = async (fileUrl: string, fileName?: string) => {
    try {
      if (fileUrl.startsWith('http')) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName || 'arquivo';
        a.target = '_blank';
        a.click();
        return;
      }
      const { data, error } = await supabase.storage.from('artwork-files').createSignedUrl(fileUrl, 3600);
      if (error || !data?.signedUrl) { toast.error('Erro ao gerar link de download'); return; }
      window.open(data.signedUrl, '_blank');
    } catch {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const formatSize = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl">Arquivos dos Clientes</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="in_review">Em revisão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filtered?.length ? <p className="text-muted-foreground">Nenhum arquivo encontrado.</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(f => (
              <TableRow key={f.id}>
                <TableCell>
                  <div className="text-sm">{f.profiles?.full_name}</div>
                  <div className="text-xs text-muted-foreground">{f.profiles?.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {f.file_type?.startsWith('image/') && (
                      <img src={f.file_url} alt="" className="h-8 w-8 rounded object-cover cursor-pointer flex-shrink-0" onClick={() => setPreviewUrl(f.file_url)} />
                    )}
                    <span className="text-sm truncate max-w-[200px]">{f.file_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatSize(f.file_size ?? 0)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(f.uploaded_at!)}</TableCell>
                <TableCell><Badge className={statusColors[f.status ?? 'pending']}>{statusLabels[f.status ?? 'pending']}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(f.file_url, f.file_name)} title="Download"><Download className="h-4 w-4" /></Button>
                    {f.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => approve.mutate(f.id)} title="Aprovar"><Check className="h-4 w-4 text-green-400" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setRejectId(f.id); setRejectOpen(true); }} title="Rejeitar"><X className="h-4 w-4 text-red-400" /></Button>
                      </>
                    )}
                    {f.file_type?.startsWith('image/') && (
                      <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(f.file_url)} title="Preview"><Eye className="h-4 w-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar Arquivo</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da rejeição..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => reject.mutate()} disabled={!rejectReason}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl('')}>
        <DialogContent className="sm:max-w-2xl">
          <img src={previewUrl} alt="" className="w-full rounded" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFiles;
