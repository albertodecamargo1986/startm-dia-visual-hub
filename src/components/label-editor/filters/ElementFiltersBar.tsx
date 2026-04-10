import { X, Search, Sparkles } from 'lucide-react';
import { type ElementFilters } from '@/hooks/use-label-filters';
import { Input } from '@/components/ui/input';

const ELEMENT_CATEGORIES = [
  { id: 'todos', label: 'Todos', emoji: '✨' },
  { id: 'setas', label: 'Setas', emoji: '➡️' },
  { id: 'simbolos', label: 'Símbolos', emoji: '⭐' },
  { id: 'decorativos', label: 'Decorativos', emoji: '🌸' },
  { id: 'icones', label: 'Ícones', emoji: '📱' },
  { id: 'badges', label: 'Badges', emoji: '🏷️' },
  { id: 'ribbons', label: 'Ribbons', emoji: '🎀' },
  { id: 'banners', label: 'Banners', emoji: '📌' },
  { id: 'formas', label: 'Formas', emoji: '🔷' },
];

interface Props {
  filters: ElementFilters;
  onUpdate: <K extends keyof ElementFilters>(k: K, v: ElementFilters[K]) => void;
  onReset: () => void;
  totalResults: number;
}

export function ElementFiltersBar({
  filters, onUpdate, onReset, totalResults,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar elemento..."
          value={filters.search}
          onChange={(e) => onUpdate('search', e.target.value)}
          className="h-8 pl-7 pr-7 text-xs"
        />
        {filters.search && (
          <button
            onClick={() => onUpdate('search', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {ELEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onUpdate('category', cat.id)}
            className={`flex-shrink-0 flex items-center gap-1
                       px-2.5 py-1 rounded-full text-[10px]
                       font-medium transition-all
                       ${filters.category === cat.id
                         ? 'bg-primary text-primary-foreground shadow-sm'
                         : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Count + clear */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {totalResults} elemento{totalResults !== 1 ? 's' : ''}
        </span>
        {(filters.search || filters.category !== 'todos') && (
          <button onClick={onReset} className="flex items-center gap-1 text-[10px] text-destructive hover:underline">
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
