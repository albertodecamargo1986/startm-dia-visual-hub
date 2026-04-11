import { useState, useMemo } from 'react';
import { Plus, Shuffle, Square, Layers, X } from 'lucide-react';
import * as fabric from 'fabric';
import {
  GRADIENT_CATEGORIES,
  type LabelGradientPreset,
  type GradientPresetCategory,
} from '@/lib/label-gradients';
import { useLabelGradients } from '@/hooks/use-label-gradients';
import { GradientBuilder } from './GradientBuilder';
import { GradientPresetCard } from './GradientPresetCard';

interface Props {
  canvas: fabric.Canvas | null;
  captureHistory: () => void;
}

export function GradientPanel({ canvas, captureHistory }: Props) {
  const widthPx = canvas?.width ?? 500;
  const heightPx = canvas?.height ?? 500;
  const [activeCategory, setActiveCategory] = useState<GradientPresetCategory>('populares');
  const [showBuilder, setShowBuilder] = useState(false);
  const [applyTarget, setApplyTarget] = useState<'object' | 'background'>('object');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    allPresets,
    customPresets,
    activeGradientId,
    applyToSelected,
    applyToBackground,
    removeFromSelected,
    saveCustomPreset,
    deleteCustomPreset,
    selectedHasGradient,
  } = useLabelGradients(canvas, widthPx, heightPx, captureHistory);

  const filteredPresets = useMemo(() => {
    let result = allPresets.filter((p) => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [allPresets, activeCategory, searchQuery]);

  const handleApplyPreset = (preset: LabelGradientPreset) => {
    if (applyTarget === 'background') {
      applyToBackground(preset);
    } else {
      applyToSelected(preset);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Target selector */}
      <div>
        <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">
          Aplicar degradê em:
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setApplyTarget('object')}
            className={`flex-1 flex items-center justify-center gap-1.5
                       py-1.5 rounded-lg text-xs transition-colors border
                       ${applyTarget === 'object'
                         ? 'bg-primary text-primary-foreground border-primary'
                         : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
          >
            <Square className="w-3.5 h-3.5" />
            Objeto
          </button>
          <button
            onClick={() => setApplyTarget('background')}
            className={`flex-1 flex items-center justify-center gap-1.5
                       py-1.5 rounded-lg text-xs transition-colors border
                       ${applyTarget === 'background'
                         ? 'bg-primary text-primary-foreground border-primary'
                         : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Fundo
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5 flex-wrap">
        {selectedHasGradient() && applyTarget === 'object' && (
          <button
            onClick={() => removeFromSelected()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]
                       bg-destructive/20 text-destructive hover:bg-destructive/30
                       transition-colors"
          >
            <X className="w-3 h-3" />
            Remover degradê
          </button>
        )}
        <button
          onClick={() => {
            const random = allPresets[Math.floor(Math.random() * allPresets.length)];
            handleApplyPreset(random);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]
                     bg-accent text-accent-foreground hover:bg-accent/80
                     transition-colors"
        >
          <Shuffle className="w-3 h-3" />
          Aleatório
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="Buscar degradê..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-1.5 text-xs rounded-lg bg-muted text-foreground
                   placeholder:text-muted-foreground border border-border
                   outline-none focus:border-primary transition-colors"
      />

      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {GRADIENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1
                       rounded-full text-[10px] font-medium transition-all
                       ${activeCategory === cat.id
                         ? 'bg-primary text-primary-foreground shadow-sm'
                         : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            {cat.id === 'personalizado' && customPresets.length > 0 && (
              <span className="ml-0.5 px-1 rounded-full bg-primary-foreground/20 text-[8px]">
                {customPresets.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create custom button */}
      <button
        onClick={() => setShowBuilder(true)}
        className="w-full flex items-center justify-center gap-2 p-2 rounded-xl
                   border border-dashed border-border hover:border-primary
                   hover:bg-primary/5 transition-all text-xs text-muted-foreground
                   hover:text-foreground"
      >
        <Plus className="w-4 h-4" />
        Criar degradê personalizado
      </button>

      {/* Presets grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {filteredPresets.map((preset) => (
          <GradientPresetCard
            key={preset.id}
            preset={preset}
            isActive={activeGradientId === preset.id}
            onApply={() => handleApplyPreset(preset)}
            onDelete={
              preset.category === 'personalizado'
                ? () => deleteCustomPreset(preset.id)
                : undefined
            }
          />
        ))}
      </div>

      {filteredPresets.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <span className="text-2xl block mb-1">🎨</span>
          <span className="text-[10px]">Nenhum degradê encontrado</span>
        </div>
      )}

      {/* Builder modal */}
      {showBuilder && (
        <GradientBuilder
          onClose={() => setShowBuilder(false)}
          onSave={(name, stops, type, angle) => {
            saveCustomPreset(name, stops, type, angle);
            setActiveCategory('personalizado');
            setShowBuilder(false);
          }}
        />
      )}
    </div>
  );
}
