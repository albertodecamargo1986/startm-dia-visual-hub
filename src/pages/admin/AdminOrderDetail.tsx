import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderItem, OrderTimeline, OrderStatus, CustomerFile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';
import { Check, X, Download, MessageCircle, Save } from 'lucide-react';

const statuses: OrderStatus[] = ['pending_payment', 'awaiting_artwork', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_MESSAGES: Record<string, string> = {
  awaiting_artwork: 'Pagamento confirmado! Por favor, envie os arquivos de arte.',
  in_production: 'Sua arte foi aprovada e seu pedido está em produção!',
  ready: 'Seu pedido está pronto para retirada/envio!',
  shipped: 'Seu pedido foi despachado!',
  delivered: 'Pedido entregue. Obrigado pela preferência!',
  cancelled: 'Pedido cancelado.',
};

const AdminOrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFileId, setRejectFileId] = useState('');
  const [rejectItemId, setRejectItemId] = useState('');

  const { data: order } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, profiles(full_name, email, phone)').eq('id', id!).single();
      return data as Order & { profiles: { full_name: string; email: string; phone: string } | null };
    },
    meta: {
      onSuccess: (data: any) => {
        if (data) {
          setAdminNotes(data.admin_notes || '');
          setEstimatedDelivery(data.estimated_delivery || '');
        }
      },
    },
  });

  // Set initial values when order loads
  useState(() => {
    if (order) {
      setAdminNotes(order.admin_notes || '');
      setEstimatedDelivery(order.estimated_delivery || '');
    }
  });

  const { data: items } = useQuery({
    queryKey: ['admin-order-items', id],
    queryFn: async () => {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', id!);
      return (data ?? []) as OrderItem[];
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ['admin-order-timeline', id],
    queryFn: async () => {
      const { data } = await supabase.from('order_timeline').select('*').eq('order_id', id!).order('created_at', { ascending: false });
      return (data ?? []) as OrderTimeline[];
    },
  });

  const { data: files } = useQuery({
    queryKey: ['admin-order-files', id],
    queryFn: async () => {
      const itemIds = items?.map(i => i.id) ?? [];
      if (!itemIds.length) return [];
      const { data } = await supabase.from('customer_files').select('*').in('order_item_id', itemIds);
      return (data ?? []) as CustomerFile[];
    },
    enabled: !!items?.length,
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      await supabase.from('orders').update({ status: newStatus }).eq('id', id!);
      await supabase.from('order_timeline').insert({
        order_id: id!, status: newStatus,
        message: note || STATUS_MESSAGES[newStatus] || `Status alterado para ${ORDER_STATUS_LABELS[newStatus as OrderStatus]}`,
        created_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-timeline', id] });
      toast.success('Status atualizado!');
      setNote('');
    },
  });

  const saveNotes = useMutation({
    mutationFn: async () => {
      await supabase.from('orders').update({ admin_notes: adminNotes, estimated_delivery: estimatedDelivery || null }).eq('id', id!);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-order', id] }); toast.success('Notas salvas!'); },
  });

  const approveArt = useMutation({
    mutationFn: async ({ fileId, itemId }: { fileId: string; itemId: string }) => {
      await supabase.from('customer_files').update({ status: 'approved' }).eq('id', fileId);
      await supabase.from('order_items').update({ artwork_status: 'approved' }).eq('id', itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-files', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-items', id] });
      toast.success('Arte aprovada!');
    },
  });

  const rejectArt = useMutation({
    mutationFn: async () => {
      await supabase.from('customer_files').update({ status: 'rejected', admin_comment: rejectReason }).eq('id', rejectFileId);
      await supabase.from('order_items').update({ artwork_status: 'rejected' }).eq('id', rejectItemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-files', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-items', id] });
      toast.success('Arte rejeitada.');
      setRejectOpen(false);
      setRejectReason('');
    },
  });

  const handleDownload = async (fileUrl: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const path = fileUrl.replace(`${supabaseUrl}/storage/v1/object/public/artwork-files/`, '');
    const { data } = await supabase.storage.from('artwork-files').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const openWhatsApp = () => {
    if (!order?.profiles?.phone) return;
    const phone = order.profiles.phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Olá ${order.profiles.full_name}! Sobre o pedido ${order.order_number}: `);
    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
  };

  if (!order) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">{order.profiles?.full_name} · {order.profiles?.email} · {order.profiles?.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={ORDER_STATUS_COLORS[order.status as OrderStatus] + ' text-sm px-3 py-1'}>{ORDER_STATUS_LABELS[order.status as OrderStatus]}</Badge>
          {order.profiles?.phone && (
            <Button variant="outline" size="sm" onClick={openWhatsApp}><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button>
          )}
        </div>
      </div>

      {/* Status change */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Alterar Status</h3>
        <div className="flex gap-3 flex-wrap">
          <Select onValueChange={val => updateStatus.mutate(val)}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Selecionar status" /></SelectTrigger>
            <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea placeholder="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} className="flex-1 min-w-[200px]" rows={1} />
        </div>
      </Card>

      {/* Admin notes & delivery */}
      <Card className="p-4 bg-card border-border space-y-3">
        <h3 className="font-display text-lg">Notas Internas</h3>
        <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Notas internas (não visíveis ao cliente)..." rows={3} />
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Previsão de Entrega</label>
            <Input type="date" value={estimatedDelivery} onChange={e => setEstimatedDelivery(e.target.value)} className="w-44" />
          </div>
          <Button size="sm" onClick={() => saveNotes.mutate()}><Save className="h-4 w-4 mr-1" />Salvar Notas</Button>
        </div>
      </Card>

      {/* Items + Artwork */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Itens</h3>
        <div className="space-y-4">
          {items?.map(item => {
            const itemFiles = files?.filter(f => f.order_item_id === item.id) ?? [];
            const snapshot = item.product_snapshot as any;
            return (
              <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {snapshot?.thumbnail && <img src={snapshot.thumbnail} alt="" className="h-12 w-12 rounded object-cover" />}
                    <div>
                      <p className="font-medium">{item.product_name} ×{item.quantity}</p>
                      {item.custom_width && item.custom_height && <p className="text-xs text-muted-foreground">{item.custom_width}×{item.custom_height}cm</p>}
                      {item.notes && <p className="text-xs text-muted-foreground italic">"{item.notes}"</p>}
                    </div>
                  </div>
                  <span className="font-semibold text-primary">R$ {Number(item.total_price).toFixed(2).replace('.', ',')}</span>
                </div>

                {/* Artwork section */}
                {itemFiles.length > 0 ? (
                  <div className="pl-2 space-y-2">
                    {itemFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-3 bg-muted/30 rounded p-2">
                        {f.file_type?.startsWith('image/') && <img src={f.file_url} alt="" className="h-16 w-16 rounded object-cover flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{f.file_name}</p>
                          <Badge className={f.status === 'approved' ? 'bg-green-500/20 text-green-400' : f.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {f.status === 'approved' ? 'Aprovada' : f.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                          </Badge>
                          {f.status === 'rejected' && f.admin_comment && <p className="text-xs text-red-400 mt-1">{f.admin_comment}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(f.file_url)} title="Download"><Download className="h-4 w-4" /></Button>
                          {f.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => approveArt.mutate({ fileId: f.id, itemId: item.id })} title="Aprovar"><Check className="h-4 w-4 text-green-400" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => { setRejectFileId(f.id); setRejectItemId(item.id); setRejectOpen(true); }} title="Rejeitar"><X className="h-4 w-4 text-red-400" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : item.artwork_status === 'pending' && (
                  <p className="text-xs text-yellow-400 pl-2">⏳ Aguardando envio da arte pelo cliente</p>
                )}
              </div>
            );
          })}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Timeline</h3>
        <div className="space-y-3">
          {timeline?.map(t => (
            <div key={t.id} className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{ORDER_STATUS_LABELS[t.status as OrderStatus] || t.status}</p>
                {t.message && <p className="text-xs text-muted-foreground">{t.message}</p>}
                <p className="text-xs text-muted-foreground">{new Date(t.created_at!).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar Arte</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da rejeição..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => rejectArt.mutate()} disabled={!rejectReason}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrderDetail;
