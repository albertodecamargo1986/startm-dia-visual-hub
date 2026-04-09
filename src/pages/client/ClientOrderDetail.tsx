import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderItem, OrderTimeline, OrderStatus, CustomerFile } from '@/types';
import { toast } from 'sonner';

const ClientOrderDetail = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id!).single();
      return data as Order;
    },
  });

  const { data: items } = useQuery({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', id!);
      return (data ?? []) as OrderItem[];
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ['order-timeline', id],
    queryFn: async () => {
      const { data } = await supabase.from('order_timeline').select('*').eq('order_id', id!).order('created_at', { ascending: false });
      return (data ?? []) as OrderTimeline[];
    },
  });

  const { data: files } = useQuery({
    queryKey: ['order-files', id],
    queryFn: async () => {
      const itemIds = items?.map(i => i.id) ?? [];
      if (!itemIds.length) return [];
      const { data } = await supabase.from('customer_files').select('*').in('order_item_id', itemIds);
      return (data ?? []) as CustomerFile[];
    },
    enabled: !!items?.length,
  });

  const handleArtworkUpload = async (file: File, orderItemId: string) => {
    if (!profile || !order) return;
    const ext = file.name.split('.').pop();
    const path = `${profile.user_id}/${order.id}/${orderItemId}-${Date.now()}.${ext}`;

    setUploadingItemId(orderItemId);
    setUploadProgress(10);

    const { error: uploadError } = await supabase.storage
      .from('artwork-files')
      .upload(path, file, { cacheControl: '3600' });

    if (uploadError) {
      toast.error('Erro no upload');
      setUploadingItemId(null);
      return;
    }

    setUploadProgress(60);

    const { data: { publicUrl } } = supabase.storage.from('artwork-files').getPublicUrl(path);

    await supabase.from('customer_files').insert({
      customer_id: profile.id,
      order_item_id: orderItemId,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      file_type: file.type,
      category: 'artwork',
    });

    setUploadProgress(80);

    await supabase.from('order_items').update({
      artwork_url: publicUrl,
      artwork_status: 'pending',
    }).eq('id', orderItemId);

    setUploadProgress(100);
    toast.success('Arte enviada! Aguardando aprovação.');

    queryClient.invalidateQueries({ queryKey: ['order-items', id] });
    queryClient.invalidateQueries({ queryKey: ['order-files', id] });
    setUploadingItemId(null);
    setUploadProgress(0);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (file) handleArtworkUpload(file, itemId);
  };

  const handleDrop = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleArtworkUpload(file, itemId);
  };

  if (!order) return <p className="text-muted-foreground">Carregando...</p>;

  const address = order.shipping_address as Record<string, string> | null;

  const getArtworkBadge = (item: OrderItem) => {
    const snapshot = item.product_snapshot as Record<string, unknown> | null;
    const needsArt = snapshot?.needs_artwork !== false;
    if (!needsArt) return <Badge className="bg-muted text-muted-foreground">Não requerida</Badge>;

    switch (item.artwork_status) {
      case 'approved': return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Arte Aprovada</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" />Arte Rejeitada</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock className="h-3 w-3 mr-1" />Aguardando Aprovação</Badge>;
      default: return <Badge className="bg-blue-500/20 text-blue-400"><AlertCircle className="h-3 w-3 mr-1" />Enviar Arte</Badge>;
    }
  };

  const getItemFile = (itemId: string) => files?.find(f => f.order_item_id === itemId);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/cliente/pedidos">Meus Pedidos</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Pedido {order.order_number}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl">Pedido {order.order_number}</h2>
        <Badge className={`${ORDER_STATUS_COLORS[order.status as OrderStatus]} text-sm px-3 py-1`}>
          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
        </Badge>
      </div>

      {/* Timeline */}
      <Card className="p-5 bg-card border-border">
        <h3 className="font-display text-lg mb-4">Timeline</h3>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
          {timeline?.map((t, i) => (
            <div key={t.id} className="relative mb-5 last:mb-0">
              <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-card border-muted-foreground'}`} />
              <p className="text-sm font-medium">{ORDER_STATUS_LABELS[t.status as OrderStatus] || t.status}</p>
              {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
              <p className="text-xs text-muted-foreground">{new Date(t.created_at!).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Items */}
      <Card className="p-5 bg-card border-border">
        <h3 className="font-display text-lg mb-4">Itens do Pedido</h3>
        <div className="space-y-4">
          {items?.map(item => {
            const snapshot = item.product_snapshot as Record<string, unknown> | null;
            const needsArt = snapshot?.needs_artwork !== false;
            const itemFile = getItemFile(item.id);
            const isRejected = item.artwork_status === 'rejected';
            const noArtYet = needsArt && !item.artwork_url && item.artwork_status !== 'approved';

            return (
              <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {snapshot?.thumbnail && (
                      <img src={snapshot.thumbnail as string} alt="" className="h-12 w-12 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.quantity}
                        {item.custom_width && item.custom_height && ` · ${item.custom_width}×${item.custom_height}cm`}
                      </p>
                    </div>
                  </div>
                  <p className="text-primary font-bold text-sm whitespace-nowrap">
                    R$ {Number(item.total_price).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  {getArtworkBadge(item)}

                  {isRejected && itemFile?.admin_comment && (
                    <p className="text-xs text-red-400">Motivo: {itemFile.admin_comment}</p>
                  )}
                </div>

                {(noArtYet || isRejected) && (
                  <div
                    className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, item.id)}
                    onClick={() => {
                      setUploadingItemId(item.id);
                      fileInputRef.current?.click();
                    }}
                  >
                    {uploadingItemId === item.id && uploadProgress > 0 ? (
                      <Progress value={uploadProgress} className="w-full" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isRejected ? 'Clique ou arraste para enviar nova arte' : 'Clique ou arraste para enviar arte'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, AI, CDR (máx 50MB)</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {Number(order.subtotal).toFixed(2).replace('.', ',')}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ {Number(order.shipping).toFixed(2).replace('.', ',')}</span></div>
          <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span className="text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span></div>
        </div>
      </Card>

      {/* Delivery address */}
      {address && address.street && (
        <Card className="p-5 bg-card border-border">
          <h3 className="font-display text-lg mb-2">Endereço de Entrega</h3>
          <p className="text-sm text-muted-foreground">
            {address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ''}<br />
            {address.neighborhood} · {address.city}/{address.state}<br />
            CEP: {address.cep}
          </p>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.ai,.cdr,.png,.jpg,.jpeg"
        onChange={e => {
          if (uploadingItemId) onFileSelect(e, uploadingItemId);
        }}
      />
    </div>
  );
};

export default ClientOrderDetail;
