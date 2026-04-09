import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';

const CartPage = () => {
  const { items, removeItem, updateQuantity, total } = useCart();

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
            <Card key={item.productId} className="p-4 flex items-center gap-4 bg-card border-border">
              <div className="h-20 w-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                {item.thumbnail && <img src={item.thumbnail} alt={item.productName} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">{item.productName}</h3>
                <p className="text-xs text-muted-foreground">R$ {item.unitPrice.toFixed(2).replace('.', ',')} / {item.priceUnit}</p>
                {item.customWidth && item.customHeight && (
                  <p className="text-xs text-muted-foreground">{item.customWidth}cm × {item.customHeight}cm</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-bold text-foreground w-24 text-right">R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}</p>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </Card>
          ))}
        </div>
        <Card className="p-6 h-fit bg-card border-border">
          <h2 className="font-display text-2xl mb-4">Resumo</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {total.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="text-muted-foreground">A calcular</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span></div>
          </div>
          <Link to="/checkout" className="block mt-6">
            <Button className="w-full font-display text-lg tracking-wider">Finalizar Pedido</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default CartPage;
