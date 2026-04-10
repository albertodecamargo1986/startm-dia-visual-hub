import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, Info } from 'lucide-react';
import { type LabelFormat, type LabelShape, FORMATS_BY_SHAPE } from '@/lib/label-formats';
import { useLabelFormats } from '@/hooks/use-label-formats';
import { CustomFormatDialog } from './CustomFormatDialog';
import { FormatPreview } from './FormatPreview';

const SHAPE_LABELS: Record<string, string> = {
  round: '⭕ Redonda',
  square: '⬛ Quadrada',
  'rounded-square': '🔲 Q. Arredondada',
  rectangle: '▬ Retângulo',
  'rounded-rectangle': '▭ Ret. Arredondado',
  special: '✦ Especiais',
  custom: '🎨 Meus Formatos',
};

interface Props {
  selectedFormat: LabelFormat | null;
  onSelectFormat: (format: LabelFormat) => void;
}

export function FormatSelector({ selectedFormat, onSelectFormat }: Props) {
  const {
    customFormats,
    loading,
    saveCustomFormat,
    deleteCustomFormat,
    renameCustomFormat,
  } = useLabelFormats();

  const [activeShape, setActiveShape] = useState<string>('round');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredFormat, setHoveredFormat] = useState<LabelFormat | null>(null);

  const currentFormats =
    activeShape === 'custom'
      ? customFormats
      : (activeShape === 'special'
          ? FORMATS_BY_SHAPE['oval']?.concat(
              FORMATS_BY_SHAPE['hexagon'] ?? [],
              FORMATS_BY_SHAPE['pentagon'] ?? [],
              FORMATS_BY_SHAPE['diamond'] ?? [],
            ) ?? []
          : FORMATS_BY_SHAPE[activeShape] ?? []);

  return (
    <div className="flex flex-col gap-3">
      {/* Shape tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(SHAPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveShape(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                       transition-all duration-150
                       ${activeShape === key
                         ? 'bg-primary text-primary-foreground shadow-sm'
                         : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {label}
            {key === 'custom' && customFormats.length > 0 && (
              <span className="ml-1 bg-primary/20 text-primary text-[9px] px-1.5 rounded-full">
                {customFormats.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Hovered format preview */}
      {hoveredFormat && (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted border border-border">
          <FormatPreview format={hoveredFormat} size={48} />
          <div>
            <p className="text-xs font-medium text-foreground">{hoveredFormat.name ?? hoveredFormat.label}</p>
            <p className="text-[10px] text-muted-foreground">
              {hoveredFormat.widthMm} × {hoveredFormat.heightMm} mm
            </p>
          </div>
        </div>
      )}

      {/* Format grid */}
      <div className="grid grid-cols-3 gap-2">
        {currentFormats.map((format) => (
          <div key={format.id} className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => onSelectFormat(format)}
              onMouseEnter={() => setHoveredFormat(format)}
              onMouseLeave={() => setHoveredFormat(null)}
              className={`w-full flex flex-col items-center gap-1.5
                         p-2 rounded-xl border transition-all duration-150
                         ${selectedFormat?.id === format.id
                           ? 'border-primary bg-primary/20 shadow-md'
                           : 'border-border bg-muted hover:border-primary/50 hover:bg-accent'}`}
            >
              <FormatPreview format={format} size={40} />

              {/* Inline rename for custom formats */}
              {renamingId === format.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => {
                    if (renameValue.trim()) renameCustomFormat(format.id, renameValue.trim());
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameCustomFormat(format.id, renameValue.trim());
                      setRenamingId(null);
                    }
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full text-center text-[9px] bg-muted rounded px-1 text-foreground outline-none border border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-[10px] text-foreground font-medium truncate w-full text-center">
                  {format.name ?? format.label}
                </span>
              )}

              <span className="text-[9px] text-muted-foreground">
                {format.widthMm}×{format.heightMm}mm
              </span>

              {selectedFormat?.id === format.id && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>

            {/* Actions for custom formats */}
            {format.isCustom && (
              <div className="flex gap-1 mt-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(format.id);
                    setRenameValue(format.name ?? format.label);
                  }}
                  className="w-5 h-5 bg-muted hover:bg-accent rounded-full flex items-center justify-center"
                >
                  <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomFormat(format.id);
                  }}
                  className="w-5 h-5 bg-destructive/20 hover:bg-destructive/40 rounded-full flex items-center justify-center"
                >
                  <Trash2 className="w-2.5 h-2.5 text-destructive" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add custom format button */}
        <button
          onClick={() => setShowCustomDialog(true)}
          className="flex flex-col items-center justify-center gap-1.5
                     p-2 rounded-xl border border-dashed border-border
                     bg-transparent hover:border-primary hover:bg-primary/10
                     transition-all duration-150 aspect-square"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Novo formato</span>
        </button>

        {/* Empty state for custom tab */}
        {activeShape === 'custom' && customFormats.length === 0 && (
          <div className="col-span-3 text-center py-6">
            <span className="text-2xl block mb-2">🎨</span>
            <p className="text-xs text-muted-foreground">
              Você ainda não criou formatos personalizados
            </p>
            <button
              onClick={() => setShowCustomDialog(true)}
              className="mt-2 text-primary text-xs underline"
            >
              Criar meu primeiro formato
            </button>
          </div>
        )}
      </div>

      {/* Custom format dialog */}
      {showCustomDialog && (
        <CustomFormatDialog
          onClose={() => setShowCustomDialog(false)}
          onSave={async (shape, w, h, name, radius) => {
            const format = await saveCustomFormat(shape, w, h, name, radius);
            if (format) {
              onSelectFormat(format);
              setShowCustomDialog(false);
              setActiveShape('custom');
            }
          }}
        />
      )}
    </div>
  );
}
