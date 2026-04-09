import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerFile } from '@/types';

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  in_review: 'Em Revisão',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  in_review: 'bg-blue-500/20 text-blue-400',
};

const formatSize = (bytes: number) => {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const ClientFiles = () => {
  const { data: files, isLoading } = useQuery({
    queryKey: ['my-files'],
    queryFn: async () => {
      const { data } = await supabase.from('customer_files').select('*').order('uploaded_at', { ascending: false });
      return (data ?? []) as CustomerFile[];
    },
  });

  // Get order_ids for items to create links
  const orderItemIds = [...new Set(files?.map(f => f.order_item_id).filter(Boolean) ?? [])];
  const { data: orderItems } = useQuery({
    queryKey: ['file-order-items', orderItemIds],
    queryFn: async () => {
      if (!orderItemIds.length) return [];
      const { data } = await supabase.from('order_items').select('id, order_id').in('id', orderItemIds as string[]);
      return data ?? [];
    },
    enabled: orderItemIds.length > 0,
  });

  const getOrderId = (orderItemId: string | null) => {
    if (!orderItemId) return null;
    return orderItems?.find(oi => oi.id === orderItemId)?.order_id ?? null;
  };

  const handleDownload = async (file: CustomerFile) => {
    try {
      // Extract path from the public URL to create signed URL
      const urlParts = file.file_url.split('/artwork-files/');
      if (urlParts.length < 2) {
        window.open(file.file_url, '_blank');
        return;
      }
      const path = urlParts[1];
      const { data, error } = await supabase.storage.from('artwork-files').createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) {
        toast.error('Erro ao gerar link de download');
        return;
      }
      window.open(data.signedUrl, '_blank');
    } catch {
      window.open(file.file_url, '_blank');
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Meus Arquivos</h2>
      {!files?.length ? (
        <p className="text-muted-foreground">Nenhum arquivo enviado ainda.</p>
      ) : (
        files.map(f => {
          const orderId = getOrderId(f.order_item_id);
          const status = f.status ?? 'pending';

          return (
            <Card key={f.id} className="p-4 bg-card border-border">
              <div className="flex items-start gap-4">
                <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-sm truncate">{f.file_name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatSize(f.file_size ?? 0)}</span>
                    <span>·</span>
                    <span>{new Date(f.uploaded_at!).toLocaleDateString('pt-BR')}</span>
                    {orderId && (
                      <>
                        <span>·</span>
                        <a href={`/cliente/pedidos/${orderId}`} className="text-primary hover:underline">Ver Pedido</a>
                      </>
                    )}
                  </div>

                  {status === 'rejected' && f.admin_comment && (
                    <div className="flex items-start gap-1.5 mt-1 text-xs text-red-400">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span>{f.admin_comment}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={statusColors[status]}>{statusLabels[status] || status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(f)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default ClientFiles;
