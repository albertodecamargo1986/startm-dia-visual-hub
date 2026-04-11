import { Trash2 } from 'lucide-react';
import { type LabelGradientPreset, gradientToCSS } from '@/lib/label-gradients';

interface Props {
  preset: LabelGradientPreset;
  isActive?: boolean;
  onApply: () => void;
  onDelete?: () => void;
}

export function GradientPresetCard({ preset, isActive, onApply, onDelete }: Props) {
  return (
    <button
      onClick={onApply}
      className={`group relative rounded-lg overflow-hidden aspect-square
                  border transition-all duration-150 hover:scale-105
                  ${isActive
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-border hover:border-primary'}`}
      style={{ background: gradientToCSS(preset) }}
    >
      {/* Name tooltip on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm
                      px-1 py-0.5 translate-y-full group-hover:translate-y-0
                      transition-transform duration-150">
        <span className="text-[8px] text-foreground font-medium truncate block text-center">
          {preset.name}
        </span>
      </div>

      {/* Delete button for custom presets */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-0.5 right-0.5 p-0.5 rounded bg-destructive/80
                     text-destructive-foreground opacity-0 group-hover:opacity-100
                     transition-opacity"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </button>
  );
}
