import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { formatBRL } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const CartPage = () => {
  const { items, removeItem, updateQuantity, updateItemNotes, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cep, setCep] = useState('');

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  if (!items.length) {
    return (
      <div className="container py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-4xl mb-4">Carrinho Vazio</h1>
        <p className="text-muted-foreground mb-8">Você ainda não adicionou produtos ao carrinho.</p>
        <Link to="/produtos"><Button className="font-display text-lg tracking-wider">Ver Produtos</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl mb-8">Carrinho</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.id} className="p-4 bg-card border-border">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  {item.thumbnail && <img src={item.thumbnail} alt={item.productName} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{item.productName}</h3>
                  <p className="text-xs text-muted-foreground">{formatBRL(item.unitPrice)} / {item.priceUnit}</p>
                  {item.customWidth && item.customHeight && (
                    <p className="text-xs text-muted-foreground">{item.customWidth}cm × {item.customHeight}cm</p>
                  )}
                  {item.needsArtwork && <p className="text-xs text-primary mt-1">⚠ Necessita envio de arte</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-bold text-foreground w-24 text-right whitespace-nowrap">{formatBRL(item.unitPrice * item.quantity)}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover item?</AlertDialogTitle>
                      <AlertDialogDescription>Tem certeza que deseja remover "{item.productName}" do carrinho?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeItem(item.id)}>Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="mt-3 pl-24">
                <Textarea
                  value={item.notes || ''}
                  onChange={e => updateItemNotes(item.id, e.target.value)}
                  placeholder="Observações deste item..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 h-fit bg-card border-border">
          <h2 className="font-display text-2xl mb-4">Resumo</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(total)}</span>
            </div>
            <div>
              <label className="text-muted-foreground text-xs block mb-1">Calcular frete</label>
              <div className="flex gap-2">
                <Input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" className="flex-1" maxLength={9} />
                <Button variant="outline" size="sm" onClick={() => {}}>Calcular</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Em breve</p>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>
          </div>
          <Button onClick={handleCheckout} className="w-full mt-6 font-display text-lg tracking-wider">
            Finalizar Compra
          </Button>
          <Link to="/produtos" className="block mt-3">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Continuar Comprando
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default CartPage;
