import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { type LabelShape } from '@/lib/label-formats';
import { FormatPreview } from './FormatPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const SHAPES: { id: LabelShape; label: string; emoji: string }[] = [
  { id: 'round', label: 'Redonda', emoji: '⭕' },
  { id: 'oval', label: 'Oval', emoji: '🥚' },
  { id: 'square', label: 'Quadrada', emoji: '⬛' },
  { id: 'rounded-square', label: 'Q. Arredondada', emoji: '🔲' },
  { id: 'rectangle', label: 'Retângulo', emoji: '▬' },
  { id: 'rounded-rectangle', label: 'Ret. Arredondado', emoji: '▭' },
  { id: 'hexagon', label: 'Hexágono', emoji: '⬡' },
  { id: 'pentagon', label: 'Pentágono', emoji: '⬠' },
  { id: 'diamond', label: 'Diamante', emoji: '◆' },
];

const PRESETS = [
  { label: '4×4cm', w: 40, h: 40 },
  { label: '5×5cm', w: 50, h: 50 },
  { label: '6×4cm', w: 60, h: 40 },
  { label: '7×5cm', w: 70, h: 50 },
  { label: '10×5cm', w: 100, h: 50 },
  { label: '10×10cm', w: 100, h: 100 },
  { label: 'A8', w: 74, h: 52 },
  { label: 'A7', w: 105, h: 74 },
];

interface Props {
  onClose: () => void;
  onSave: (
    shape: LabelShape,
    widthMm: number,
    heightMm: number,
    name: string,
    cornerRadiusMm?: number,
  ) => void;
}

export function CustomFormatDialog({ onClose, onSave }: Props) {
  const [shape, setShape] = useState<LabelShape>('round');
  const [widthMm, setWidthMm] = useState(50);
  const [heightMm, setHeightMm] = useState(50);
  const [name, setName] = useState('');
  const [cornerRadius, setCornerRadius] = useState(5);

  const showRadius = shape === 'rounded-square' || shape === 'rounded-rectangle';
  const isSymmetric = shape === 'round' || shape === 'square' || shape === 'rounded-square'
    || shape === 'hexagon' || shape === 'pentagon';

  const previewFormat = {
    id: 'preview',
    shape,
    label: name || 'Preview',
    name: name || 'Preview',
    widthMm,
    heightMm: isSymmetric ? widthMm : heightMm,
    cornerRadiusMm: showRadius ? cornerRadius : undefined,
  };

  const handlePreset = (w: number, h: number, label: string) => {
    setWidthMm(w);
    setHeightMm(h);
    if (!name.trim()) setName(`${label} ${SHAPES.find(s => s.id === shape)?.label ?? ''}`);
  };

  const effectiveH = isSymmetric ? widthMm : heightMm;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Formato Personalizado</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <Label className="text-xs">Nome do formato</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Minha etiqueta 6cm"
              className="h-8 text-sm mt-1"
            />
          </div>

          {/* Shape selector */}
          <div>
            <Label className="text-xs">Forma</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShape(s.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-all
                             ${shape === s.id
                               ? 'bg-primary text-primary-foreground'
                               : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset sizes */}
          <div>
            <Label className="text-xs">Tamanhos rápidos</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.w, p.h, p.label)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all
                             ${widthMm === p.w && effectiveH === p.h
                               ? 'bg-primary text-primary-foreground'
                               : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                {isSymmetric ? 'Tamanho (mm)' : 'Largura (mm)'}
              </Label>
              <Input
                type="number"
                min={10}
                max={300}
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
                className="h-8 text-sm mt-1"
              />
            </div>
            {!isSymmetric && (
              <div>
                <Label className="text-xs">Altura (mm)</Label>
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value))}
                  className="h-8 text-sm mt-1"
                />
              </div>
            )}
          </div>

          {/* Corner radius */}
          {showRadius && (
            <div>
              <Label className="text-xs">Raio de canto (mm)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={cornerRadius}
                onChange={(e) => setCornerRadius(Number(e.target.value))}
                className="h-8 text-sm mt-1"
              />
            </div>
          )}

          {/* Live preview */}
          <div className="flex flex-col items-center gap-2 py-4 bg-muted rounded-lg">
            <FormatPreview format={previewFormat} size={80} isSelected />
            <span className="text-[10px] text-muted-foreground">
              {widthMm} × {effectiveH} mm
            </span>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Formatos personalizados ficam salvos na sua conta e podem ser reutilizados em novos projetos.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(shape, widthMm, effectiveH, name, showRadius ? cornerRadius : undefined)}
              disabled={!name.trim() || widthMm < 10 || effectiveH < 10}
              className="flex-1"
            >
              Criar Formato
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
