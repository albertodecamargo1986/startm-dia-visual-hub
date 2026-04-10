import { useState } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import * as fabric from 'fabric';
import {
  GRADIENT_PRESETS,
  GRADIENT_CATEGORIES,
  GRADIENTS_BY_CATEGORY,
} from '@/lib/gradient-presets';
import {
  type GradientDirection,
  type GradientType,
  gradientToCSS,
} from '@/lib/label-gradients';
import { useGradient } from '@/hooks/use-gradient';

const DIRECTIONS: { id: GradientDirection; label: string; icon: string }[] = [
  { id: 'to-right',        label: '→', icon: '→' },
  { id: 'to-left',         label: '←', icon: '←' },
  { id: 'to-bottom',       label: '↓', icon: '↓' },
  { id: 'to-top',          label: '↑', icon: '↑' },
  { id: 'to-bottom-right', label: '↘', icon: '↘' },
  { id: 'to-bottom-left',  label: '↙', icon: '↙' },
  { id: 'to-top-right',    label: '↗', icon: '↗' },
  { id: 'to-top-left',     label: '↖', icon: '↖' },
];

interface Props {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.FabricObject | null;
  onHistoryCapture: () => void;
}

export function GradientPanel({ canvas, selectedObject, onHistoryCapture }: Props) {
  const [activeCategory, setActiveCategory] = useState('populares');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const {
    customStops, customType, customDirection, gradientTarget,
    customGradientCSS, setCustomType, setCustomDirection, setGradientTarget,
    applyPreset, applyCustomGradient, removeGradient,
    addStop, removeStop, updateStop,
  } = useGradient({ canvas, onHistoryCapture });

  const hasSelection = !!selectedObject;

  return (
    <div className="flex flex-col gap-3">
      {/* Target */}
      <div>
        <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Aplicar em</span>
        <div className="flex gap-1.5">
          {([
            { id: 'fill' as const, label: '🎨 Objeto' },
            { id: 'background' as const, label: '🖼️ Fundo' },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setGradientTarget(opt.id)}
              disabled={opt.id === 'fill' && !hasSelection}
              className={`flex-1 py-1.5 rounded-lg text-[10px] transition-colors border
                         ${gradientTarget === opt.id
                           ? 'bg-primary text-primary-foreground border-primary'
                           : 'bg-muted text-muted-foreground border-border hover:bg-accent'}
                         ${opt.id === 'fill' && !hasSelection ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {!hasSelection && gradientTarget === 'fill' && (
          <p className="text-[9px] text-muted-foreground mt-1">Selecione um objeto no canvas</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
        {([
          { id: 'presets' as const, label: '✨ Presets' },
          { id: 'custom' as const, label: '🎨 Personalizado' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1 rounded-md text-[10px] transition-colors
                       ${activeTab === tab.id
                         ? 'bg-background text-foreground shadow-sm'
                         : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PRESETS ── */}
      {activeTab === 'presets' && (
        <>
          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {GRADIENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1
                           px-2 py-1 rounded-full text-[9px]
                           font-medium transition-all
                           ${activeCategory === cat.id
                             ? 'bg-primary text-primary-foreground shadow-sm'
                             : 'bg-muted text-muted-foreground hover:bg-accent'}`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Preset grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {(GRADIENTS_BY_CATEGORY[activeCategory] ?? []).map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset, gradientTarget)}
                className="group relative rounded-lg overflow-hidden
                           aspect-square border border-border
                           hover:border-primary hover:scale-105
                           transition-all duration-150"
                style={{ background: gradientToCSS(preset) }}
              >
                <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm
                                px-1 py-0.5 translate-y-full group-hover:translate-y-0
                                transition-transform duration-150">
                  <span className="text-[8px] text-foreground font-medium truncate block text-center">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── CUSTOM ── */}
      {activeTab === 'custom' && (
        <div className="flex flex-col gap-3">
          {/* Preview */}
          <div
            className="h-10 rounded-lg border border-border"
            style={{ background: customGradientCSS }}
          />

          {/* Type */}
          <div>
            <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Tipo</span>
            <div className="flex gap-1.5">
              {(['linear', 'radial'] as GradientType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setCustomType(t)}
                  className={`flex-1 py-1 rounded-lg text-[10px] capitalize transition-colors border
                             ${customType === t
                               ? 'bg-primary/20 text-primary border-primary/30'
                               : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
                >
                  {t === 'linear' ? '↔ Linear' : '◎ Radial'}
                </button>
              ))}
            </div>
          </div>

          {/* Direction (linear only) */}
          {customType === 'linear' && (
            <div>
              <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Direção</span>
              <div className="grid grid-cols-4 gap-1">
                {DIRECTIONS.map((dir) => (
                  <button
                    key={dir.id}
                    onClick={() => setCustomDirection(dir.id)}
                    className={`py-1.5 rounded-lg text-sm transition-colors border
                               ${customDirection === dir.id
                                 ? 'bg-primary/20 text-primary border-primary/30'
                                 : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
                  >
                    {dir.icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color stops */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">
                Cores ({customStops.length}/5)
              </span>
              <button
                onClick={addStop}
                disabled={customStops.length >= 5}
                className="flex items-center gap-0.5 text-[9px]
                           text-primary hover:text-primary/80
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" />
                Adicionar
              </button>
            </div>

            {/* Gradient bar with stop indicators */}
            <div
              className="relative h-3 rounded-full mb-2 border border-border"
              style={{ background: customGradientCSS }}
            >
              {customStops.map((stop, i) => (
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
              {customStops.map((stop, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {/* Color picker */}
                  <div className="relative w-6 h-6 rounded border border-border shrink-0 overflow-hidden">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => updateStop(i, 'color', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: stop.color }} />
                  </div>

                  {/* Offset slider */}
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

                  {/* Remove */}
                  <button
                    onClick={() => removeStop(i)}
                    disabled={customStops.length <= 2}
                    className="text-destructive/60 hover:text-destructive
                               disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={() => applyCustomGradient(gradientTarget)}
            disabled={gradientTarget === 'fill' && !hasSelection}
            className="w-full py-2 rounded-xl text-xs font-medium
                       text-primary-foreground transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: customGradientCSS }}
          >
            Aplicar Gradiente
          </button>
        </div>
      )}

      {/* Remove gradient */}
      {hasSelection && (
        <button
          onClick={() => removeGradient('#FFFFFF')}
          className="flex items-center justify-center gap-1.5
                     w-full py-1.5 rounded-lg text-[10px]
                     text-muted-foreground hover:text-foreground
                     bg-muted hover:bg-accent
                     border border-border transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Remover gradiente
        </button>
      )}
    </div>
  );
}
