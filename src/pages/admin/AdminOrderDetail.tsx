import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order, OrderItem, OrderTimeline, OrderStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';

const statuses: OrderStatus[] = ['pending_payment','awaiting_artwork','in_production','ready','shipped','delivered','cancelled','refunded'];

const AdminOrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const { data: order } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => { const { data } = await supabase.from('orders').select('*, profiles(full_name, email, phone)').eq('id', id!).single(); return data as Order & { profiles: any }; },
  });

  const { data: items } = useQuery({
    queryKey: ['admin-order-items', id],
    queryFn: async () => { const { data } = await supabase.from('order_items').select('*').eq('order_id', id!); return (data ?? []) as OrderItem[]; },
  });

  const { data: timeline } = useQuery({
    queryKey: ['admin-order-timeline', id],
    queryFn: async () => { const { data } = await supabase.from('order_timeline').select('*').eq('order_id', id!).order('created_at', { ascending: false }); return (data ?? []) as OrderTimeline[]; },
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      await supabase.from('orders').update({ status: newStatus }).eq('id', id!);
      await supabase.from('order_timeline').insert({ order_id: id!, status: newStatus, message: note || `Status alterado para ${ORDER_STATUS_LABELS[newStatus as OrderStatus]}`, created_by: user?.id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-order', id] }); queryClient.invalidateQueries({ queryKey: ['admin-order-timeline', id] }); toast.success('Status atualizado!'); setNote(''); },
  });

  if (!order) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">{order.profiles?.full_name} · {order.profiles?.email} · {order.profiles?.phone}</p>
        </div>
        <Badge className={ORDER_STATUS_COLORS[order.status as OrderStatus]}>{ORDER_STATUS_LABELS[order.status as OrderStatus]}</Badge>
      </div>

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

      <Card className="p-4 bg-card border-border">
        <h3 className="font-display text-lg mb-3">Itens</h3>
        <div className="space-y-2">
          {items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product_name} ×{item.quantity} {item.custom_width && item.custom_height ? `(${item.custom_width}×${item.custom_height}cm)` : ''}</span>
              <span className="text-primary">R$ {Number(item.total_price).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Total</span><span className="text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span></div>
        </div>
      </Card>

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
    </div>
  );
};

export default AdminOrderDetail;
