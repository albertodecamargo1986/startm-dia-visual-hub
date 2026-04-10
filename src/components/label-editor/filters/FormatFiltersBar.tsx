import { useState } from 'react';
import { X, SlidersHorizontal, Search, Sparkles } from 'lucide-react';
import { type FormatFilters } from '@/hooks/use-label-filters';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const SHAPES = [
  { id: 'todos', label: 'Todos', emoji: '🔷' },
  { id: 'round', label: 'Redonda', emoji: '⭕' },
  { id: 'oval', label: 'Oval', emoji: '🥚' },
  { id: 'square', label: 'Quadrada', emoji: '⬛' },
  { id: 'rounded-square', label: 'Q. Arred.', emoji: '🔲' },
  { id: 'rectangle', label: 'Retângulo', emoji: '▬' },
  { id: 'rounded-rectangle', label: 'Ret. Arred.', emoji: '▭' },
  { id: 'hexagon', label: 'Hexágono', emoji: '⬡' },
  { id: 'diamond', label: 'Diamante', emoji: '◆' },
];

interface Props {
  filters: FormatFilters;
  activeFilterCount: number;
  onUpdate: <K extends keyof FormatFilters>(k: K, v: FormatFilters[K]) => void;
  onReset: () => void;
  totalResults: number;
}

export function FormatFiltersBar({
  filters, activeFilterCount, onUpdate, onReset, totalResults,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* Search + advanced toggle */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar formato..."
            value={filters.search}
            onChange={(e) => onUpdate('search', e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`relative flex items-center gap-1 px-2.5 py-1.5
                     rounded-lg text-xs border transition-colors
                     ${showAdvanced
                       ? 'bg-primary text-primary-foreground border-primary'
                       : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Shape chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            onClick={() => onUpdate('shape', s.id)}
            className={`flex-shrink-0 flex items-center gap-1
                       px-2.5 py-1 rounded-full text-[10px]
                       font-medium transition-all
                       ${filters.shape === s.id
                         ? 'bg-primary text-primary-foreground shadow-sm'
                         : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Advanced panel */}
      {showAdvanced && (
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-muted border border-border">
          {/* Width range */}
          <div>
            <Label className="text-[10px] text-muted-foreground">
              Largura: {filters.widthRange[0]}mm – {filters.widthRange[1]}mm
            </Label>
            <div className="flex gap-2 mt-1">
              <input
                type="range"
                min={10}
                max={300}
                value={filters.widthRange[0]}
                onChange={(e) => onUpdate('widthRange', [+e.target.value, filters.widthRange[1]])}
                className="flex-1 accent-primary h-1"
              />
              <input
                type="range"
                min={10}
                max={300}
                value={filters.widthRange[1]}
                onChange={(e) => onUpdate('widthRange', [filters.widthRange[0], +e.target.value])}
                className="flex-1 accent-primary h-1"
              />
            </div>
          </div>

          {/* Height range */}
          <div>
            <Label className="text-[10px] text-muted-foreground">
              Altura: {filters.heightRange[0]}mm – {filters.heightRange[1]}mm
            </Label>
            <div className="flex gap-2 mt-1">
              <input
                type="range"
                min={10}
                max={300}
                value={filters.heightRange[0]}
                onChange={(e) => onUpdate('heightRange', [+e.target.value, filters.heightRange[1]])}
                className="flex-1 accent-primary h-1"
              />
              <input
                type="range"
                min={10}
                max={300}
                value={filters.heightRange[1]}
                onChange={(e) => onUpdate('heightRange', [filters.heightRange[0], +e.target.value])}
                className="flex-1 accent-primary h-1"
              />
            </div>
          </div>

          {/* Custom only toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={filters.onlyCustom}
              onCheckedChange={(checked) => onUpdate('onlyCustom', checked)}
              className="scale-75"
            />
            <Label className="text-[10px] text-muted-foreground">
              Apenas meus formatos
            </Label>
          </div>

          {/* Results + clear */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {totalResults} formato{totalResults !== 1 ? 's' : ''}
            </span>
            {activeFilterCount > 0 && (
              <button onClick={onReset} className="flex items-center gap-1 text-[10px] text-destructive hover:underline">
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
