import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import {
  type GradientStop,
  type GradientType,
  type GradientDirection,
  gradientToCSS,
  DIRECTION_ANGLES,
} from '@/lib/label-gradients';

const DIRECTIONS: { id: GradientDirection; icon: string }[] = [
  { id: 'to-right',        icon: '→' },
  { id: 'to-left',         icon: '←' },
  { id: 'to-bottom',       icon: '↓' },
  { id: 'to-top',          icon: '↑' },
  { id: 'to-bottom-right', icon: '↘' },
  { id: 'to-bottom-left',  icon: '↙' },
  { id: 'to-top-right',    icon: '↗' },
  { id: 'to-top-left',     icon: '↖' },
];

interface Props {
  onClose: () => void;
  onSave: (name: string, stops: GradientStop[], type: GradientType, angle: number) => void;
  onApplyPreview?: (stops: GradientStop[], type: GradientType, angle: number) => void;
}

export function GradientBuilder({ onClose, onSave, onApplyPreview }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<GradientType>('linear');
  const [direction, setDirection] = useState<GradientDirection>('to-right');
  const [customAngle, setCustomAngle] = useState(90);
  const [stops, setStops] = useState<GradientStop[]>([
    { offset: 0, color: '#3B82F6' },
    { offset: 1, color: '#8B5CF6' },
  ]);

  const angle = direction === 'custom-angle' ? customAngle : DIRECTION_ANGLES[direction];

  const previewCSS = gradientToCSS({
    id: 'preview', name: '', category: 'personalizado',
    type, direction, angle: customAngle, stops,
  });

  const updateStop = (i: number, field: keyof GradientStop, value: string | number) => {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addStop = () => {
    if (stops.length >= 5) return;
    const last = stops[stops.length - 1].offset;
    setStops((prev) => [...prev, { offset: Math.min(last + 0.2, 1), color: '#FFFFFF' }]);
  };

  const removeStop = (i: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), stops, type, angle);
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Criar Degradê</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preview */}
      <div className="h-12 rounded-lg border border-border" style={{ background: previewCSS }} />

      {/* Name */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do degradê"
        className="px-3 py-1.5 text-xs rounded-lg bg-muted text-foreground
                   placeholder:text-muted-foreground border border-border
                   outline-none focus:border-primary transition-colors"
      />

      {/* Type */}
      <div>
        <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Tipo</span>
        <div className="flex gap-1.5">
          {(['linear', 'radial'] as GradientType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-1 rounded-lg text-[10px] capitalize transition-colors border
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
          <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Direção</span>
          <div className="grid grid-cols-4 gap-1">
            {DIRECTIONS.map((dir) => (
              <button
                key={dir.id}
                onClick={() => setDirection(dir.id)}
                className={`py-1.5 rounded-lg text-sm transition-colors border
                           ${direction === dir.id
                             ? 'bg-primary/20 text-primary border-primary/30'
                             : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
              >
                {dir.icon}
              </button>
            ))}
          </div>

          {/* Custom angle */}
          <button
            onClick={() => setDirection('custom-angle')}
            className={`mt-1 w-full py-1 rounded-lg text-[10px] transition-colors border
                       ${direction === 'custom-angle'
                         ? 'bg-primary/20 text-primary border-primary/30'
                         : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
          >
            🎯 Ângulo personalizado
          </button>

          {direction === 'custom-angle' && (
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="range"
                min={0}
                max={360}
                value={customAngle}
                onChange={(e) => setCustomAngle(+e.target.value)}
                className="flex-1 accent-primary h-1"
              />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{customAngle}°</span>
            </div>
          )}
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
            Adicionar
          </button>
        </div>

        {/* Gradient bar with indicators */}
        <div
          className="relative h-3 rounded-full mb-2 border border-border"
          style={{ background: previewCSS }}
        >
          {stops.map((stop, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full
                         border-2 border-background shadow-sm"
              style={{ left: `${stop.offset * 100}%`, backgroundColor: stop.color }}
            />
          ))}
        </div>

        {/* Stop list */}
        <div className="space-y-1.5">
          {stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="relative w-6 h-6 rounded border border-border shrink-0 overflow-hidden">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(i, 'color', e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: stop.color }} />
              </div>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={stop.offset}
                  onChange={(e) => updateStop(i, 'offset', +e.target.value)}
                  className="flex-1 accent-primary h-1"
                />
                <span className="text-[9px] text-muted-foreground w-7 text-right">
                  {Math.round(stop.offset * 100)}%
                </span>
              </div>
              <button
                onClick={() => removeStop(i)}
                disabled={stops.length <= 2}
                className="text-destructive/60 hover:text-destructive
                           disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl
                     text-xs font-medium bg-primary text-primary-foreground
                     hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Salvar
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium
                     bg-muted text-muted-foreground hover:bg-accent
                     transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
