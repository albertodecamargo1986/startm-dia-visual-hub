import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', city: '', state: 'SP', zip: '' });
  const [notes, setNotes] = useState('');

  if (!items.length) { navigate('/carrinho'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const { data: orderNumber } = await supabase.rpc('generate_order_number');

    const { data: order, error } = await supabase.from('orders').insert({
      order_number: orderNumber || `SM-${Date.now()}`,
      customer_id: profile.id,
      subtotal: total,
      total: total,
      shipping_address: address,
      notes,
      status: 'pending_payment',
      payment_status: 'pending',
    }).select().single();

    if (error || !order) {
      toast.error('Erro ao criar pedido.');
      setLoading(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
      custom_width: item.customWidth,
      custom_height: item.customHeight,
    }));

    await supabase.from('order_items').insert(orderItems);
    await supabase.from('order_timeline').insert({ order_id: order.id, status: 'pending_payment', message: 'Pedido criado.' });

    clearCart();
    navigate('/checkout/sucesso');
    setLoading(false);
  };

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-card border-border">
            <h2 className="font-display text-2xl mb-4">Endereço de Entrega</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Rua" required value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} className="md:col-span-2" />
              <Input placeholder="Número" required value={address.number} onChange={e => setAddress(p => ({ ...p, number: e.target.value }))} />
              <Input placeholder="Complemento" value={address.complement} onChange={e => setAddress(p => ({ ...p, complement: e.target.value }))} />
              <Input placeholder="Bairro" required value={address.neighborhood} onChange={e => setAddress(p => ({ ...p, neighborhood: e.target.value }))} />
              <Input placeholder="Cidade" required value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
              <Input placeholder="Estado" required value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} />
              <Input placeholder="CEP" required value={address.zip} onChange={e => setAddress(p => ({ ...p, zip: e.target.value }))} />
            </div>
          </Card>
          <Card className="p-6 bg-card border-border">
            <h2 className="font-display text-2xl mb-4">Observações</h2>
            <Textarea placeholder="Alguma observação sobre o pedido?" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </Card>
          <Button type="submit" disabled={loading} className="w-full font-display text-lg tracking-wider">{loading ? 'Processando...' : 'Finalizar Pedido'}</Button>
        </form>

        <Card className="p-6 h-fit bg-card border-border">
          <h2 className="font-display text-2xl mb-4">Resumo</h2>
          <div className="space-y-3">
            {items.map(i => (
              <div key={i.productId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{i.productName} ×{i.quantity}</span>
                <span>R$ {(i.unitPrice * i.quantity).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
