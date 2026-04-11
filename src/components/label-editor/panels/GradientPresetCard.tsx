import { useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { type LabelGradientPreset, gradientToCSS } from '@/lib/label-gradients';

interface Props {
  preset: LabelGradientPreset;
  isActive: boolean;
  isCustom?: boolean;
  onApply: () => void;
  onDelete?: () => void;
}

export function GradientPresetCard({
  preset, isActive, isCustom, onApply, onDelete,
}: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={onApply}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`w-full rounded-xl overflow-hidden border transition-all
                   duration-200 hover:scale-[1.04]
                   ${isActive
                     ? 'border-primary shadow-lg shadow-primary/30'
                     : 'border-border hover:border-muted-foreground/30'}`}
      >
        {/* Gradient preview */}
        <div
          className="h-16 w-full"
          style={{ background: gradientToCSS(preset) }}
        />

        {/* Name */}
        <div className="px-1.5 py-1 bg-card">
          <span className="text-[9px] text-muted-foreground font-medium truncate block text-center">
            {preset.name}
          </span>
        </div>

        {/* Active check */}
        {isActive && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary
                         flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}

        {/* Hover overlay */}
        {hovered && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]
                         flex items-center justify-center rounded-xl">
            <span className="text-[10px] font-medium text-foreground bg-background/70
                            px-2 py-0.5 rounded-full">
              Aplicar
            </span>
          </div>
        )}
      </button>

      {/* Delete button for custom presets */}
      {isCustom && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1.5 -right-1.5 hidden group-hover:flex
                     w-5 h-5 bg-destructive hover:bg-destructive/80 rounded-full
                     items-center justify-center transition-colors"
        >
          <Trash2 className="w-2.5 h-2.5 text-destructive-foreground" />
        </button>
      )}
    </div>
  );
}
