import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export const CartButton = () => {
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Carrinho">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
              {itemCount}
            </Badge>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Carrinho ({itemCount})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Seu carrinho está vazio.
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.productName} className="h-16 w-16 rounded-md object-cover bg-muted" />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      {(item.customWidth || item.customHeight) && (
                        <p className="text-xs text-muted-foreground">{item.customWidth}×{item.customHeight} cm</p>
                      )}
                      <p className="text-sm text-primary font-semibold">{fmt(item.unitPrice)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <SheetFooter className="flex-col gap-3 pt-4 sm:flex-col">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{fmt(subtotal)}</span>
              </div>
              <Link to="/carrinho" className="w-full">
                <Button variant="outline" className="w-full">Ver Carrinho</Button>
              </Link>
              <Link to="/checkout" className="w-full">
                <Button className="w-full">Finalizar Compra</Button>
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
