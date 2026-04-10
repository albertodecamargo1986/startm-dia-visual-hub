import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart } from 'lucide-react';
import { mmToPx, type LabelFormat } from '@/lib/label-formats';
import { KEYBOARD_SHORTCUTS, FINISHING_OPTIONS } from './types';
import type { Canvas as FabricCanvas } from 'fabric';

// ── Print Preview Dialog ──
export const PrintPreviewDialog = ({ open, onOpenChange, canvasRef, format: fmt }: {
  open: boolean; onOpenChange: (v: boolean) => void; canvasRef: React.RefObject<FabricCanvas | null>; format: LabelFormat | null;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!open || !canvasRef.current || !fmt) return;
    const fc = canvasRef.current;
    const origZoom = fc.getZoom();
    fc.setZoom(1); fc.renderAll();
    const el = fc.toCanvasElement(2);
    const url = el.toDataURL('image/png');
    fc.setZoom(origZoom); fc.renderAll();
    setPreviewUrl(url);
    return () => setPreviewUrl(null);
  }, [open, canvasRef, fmt]);
  if (!fmt) return null;
  const isRound = fmt.shape === 'round';
  const isRounded = fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Prévia de Impressão</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground">Simulação do resultado final com corte</p>
          <div className="bg-white p-8 rounded-lg border shadow-inner flex items-center justify-center" style={{ minHeight: 300 }}>
            {previewUrl && (
              <div className="relative shadow-lg" style={{ width: Math.min(250, mmToPx(fmt.widthMm)), height: Math.min(250, mmToPx(fmt.heightMm)), borderRadius: isRound ? '50%' : isRounded ? 12 : 0, overflow: 'hidden', border: '1px dashed #ccc' }}>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            <p>Formato: {fmt.shape} • {fmt.widthMm / 10}×{fmt.heightMm / 10}cm</p>
            <p>A linha tracejada indica a área de corte</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Save As Dialog ──
export const SaveAsDialog = ({ open, onOpenChange, saveAsName, onNameChange, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; saveAsName: string; onNameChange: (v: string) => void; onSave: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Salvar como novo projeto</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Nome do novo projeto</Label>
          <Input value={saveAsName} onChange={e => onNameChange(e.target.value)} placeholder="Nome do projeto" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button onClick={onSave} disabled={!saveAsName.trim()}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ── Shortcuts Dialog ──
export const ShortcutsDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-xs">
      <DialogHeader><DialogTitle>Atalhos de Teclado</DialogTitle></DialogHeader>
      <div className="space-y-2">
        {KEYBOARD_SHORTCUTS.map(s => (
          <div key={s.keys} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{s.action}</span>
            <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{s.keys}</kbd>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

// ── Add to Cart Dialog ──
export const AddToCartDialog = ({ open, onOpenChange, projectName, format, cartQuantity, cartFinishing, onQuantityChange, onFinishingChange, onAddToCart }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  projectName: string; format: LabelFormat | null;
  cartQuantity: number; cartFinishing: string;
  onQuantityChange: (qty: number) => void; onFinishingChange: (id: string) => void;
  onAddToCart: () => void;
}) => {
  const selectedFinishing = FINISHING_OPTIONS.find(f => f.id === cartFinishing);
  const cartUnitPrice = 0.15 + (selectedFinishing?.price || 0);
  const cartTotal = cartUnitPrice * cartQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Adicionar ao Carrinho</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium">{projectName}</p>
            <p className="text-xs text-muted-foreground">{format?.shape} • {format && `${format.widthMm / 10}×${format.heightMm / 10}cm`}</p>
          </div>
          <div>
            <Label className="text-sm">Quantidade</Label>
            <div className="flex items-center gap-2 mt-1">
              {[50, 100, 250, 500, 1000].map(qty => (
                <Button key={qty} variant={cartQuantity === qty ? 'default' : 'outline'} size="sm" className="text-xs"
                  onClick={() => onQuantityChange(qty)}>{qty}</Button>
              ))}
            </div>
            <Input type="number" value={cartQuantity} onChange={e => onQuantityChange(Math.max(10, Number(e.target.value)))} className="mt-2 h-9" min={10} />
          </div>
          <div>
            <Label className="text-sm">Acabamento</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {FINISHING_OPTIONS.map(opt => (
                <Button key={opt.id} variant={cartFinishing === opt.id ? 'default' : 'outline'} size="sm" className="text-xs h-auto py-2"
                  onClick={() => onFinishingChange(opt.id)}>
                  <div className="text-left">
                    <span className="block">{opt.label}</span>
                    {opt.price > 0 && <span className="block text-[10px] text-muted-foreground">+R$ {opt.price.toFixed(2)}/un</span>}
                  </div>
                </Button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span>Preço unitário:</span>
            <span className="font-medium">R$ {cartUnitPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
          </div>
          <Button className="w-full" size="lg" onClick={onAddToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" />Adicionar ao Carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
