import { useState } from 'react';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { type GradientStop, type GradientType, gradientToCSS } from '@/lib/label-gradients';

interface Props {
  onClose: () => void;
  onSave: (name: string, stops: GradientStop[], type: GradientType, angle: number) => void;
  onApplyPreview?: (stops: GradientStop[], type: GradientType, angle: number) => void;
}

const DIRECTION_OPTIONS = [
  { label: '→', angle: 0 },
  { label: '↘', angle: 45 },
  { label: '↓', angle: 90 },
  { label: '↙', angle: 135 },
  { label: '←', angle: 180 },
  { label: '↖', angle: 225 },
  { label: '↑', angle: 270 },
  { label: '↗', angle: 315 },
];

export function GradientBuilder({ onClose, onSave, onApplyPreview }: Props) {
  const [name, setName] = useState('Meu Degradê');
  const [type, setType] = useState<GradientType>('linear');
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<GradientStop[]>([
    { offset: 0, color: '#6366F1' },
    { offset: 1, color: '#EC4899' },
  ]);

  const previewCSS = gradientToCSS({
    id: 'preview', name: '', category: 'personalizado',
    type, direction: 'custom-angle', angle, stops,
  });

  const addStop = () => {
    if (stops.length >= 5) return;
    setStops((prev) => [...prev, { offset: 0.5, color: '#FFFFFF' }].sort((a, b) => a.offset - b.offset));
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, field: keyof GradientStop, value: string | number) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Criar Degradê</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live preview */}
      <div className="h-14 rounded-lg border border-border" style={{ background: previewCSS }} />

      {/* Name */}
      <div>
        <span className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg bg-muted text-foreground
                     border border-border outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Type */}
      <div>
        <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Tipo</span>
        <div className="flex gap-1.5">
          {(['linear', 'radial'] as GradientType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-colors border
                         ${type === t
                           ? 'bg-primary/20 text-primary border-primary/30'
                           : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
            >
              {t === 'linear' ? '↔ Linear' : '◎ Radial'}
            </button>
          ))}
        </div>
      </div>

      {/* Direction (linear only) */}
      {type === 'linear' && (
        <div>
          <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">
            Direção — {angle}°
          </span>
          <div className="grid grid-cols-4 gap-1">
            {DIRECTION_OPTIONS.map((opt) => (
              <button
                key={opt.angle}
                onClick={() => setAngle(opt.angle)}
                className={`py-1.5 rounded-lg text-sm transition-colors border
                           ${angle === opt.angle
                             ? 'bg-primary/20 text-primary border-primary/30'
                             : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Custom angle slider */}
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-primary h-1 mt-2"
          />
        </div>
      )}

      {/* Color stops */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            Cores ({stops.length}/5)
          </span>
          <button
            onClick={addStop}
            disabled={stops.length >= 5}
            className="flex items-center gap-0.5 text-[9px] text-primary hover:text-primary/80
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Adicionar cor
          </button>
        </div>

        {/* Stop list */}
        <div className="space-y-2">
          {stops.map((stop, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {/* Color picker */}
              <div className="relative w-7 h-7 rounded border border-border shrink-0 overflow-hidden">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(idx, 'color', e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: stop.color }} />
              </div>

              {/* Offset slider */}
              <div className="flex-1">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[8px] text-muted-foreground">Posição</span>
                  <span className="text-[8px] text-muted-foreground">{Math.round(stop.offset * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={stop.offset}
                  onChange={(e) => updateStop(idx, 'offset', parseFloat(e.target.value))}
                  className="w-full accent-primary h-1"
                />
              </div>

              {/* Hex value */}
              <input
                value={stop.color}
                onChange={(e) => updateStop(idx, 'color', e.target.value)}
                className="w-16 px-1.5 py-1 text-[9px] rounded bg-muted text-foreground
                           border border-border outline-none font-mono"
              />

              {/* Remove */}
              {stops.length > 2 && (
                <button
                  onClick={() => removeStop(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Color bar preview */}
        <div className="h-3 rounded-full mt-2 border border-border" style={{ background: previewCSS }} />
      </div>

      {/* Footer */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg text-xs bg-muted text-muted-foreground
                     hover:bg-accent transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(name, stops, type, angle)}
          disabled={!name.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                     text-xs bg-primary text-primary-foreground hover:bg-primary/90
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Salvar
        </button>
      </div>
    </div>
  );
}
