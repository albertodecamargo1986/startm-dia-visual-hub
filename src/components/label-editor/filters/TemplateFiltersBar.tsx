import { useState } from 'react';
import {
  SlidersHorizontal, X, Search,
  ArrowUpAZ, ArrowDownAZ, Clock, Tag, Sparkles,
} from 'lucide-react';
import { type TemplateFilters, type SortOrder, type PremiumFilter } from '@/hooks/use-label-filters';
import { TEMPLATE_CATEGORIES } from '@/lib/label-templates';
import { Input } from '@/components/ui/input';

const ALL_CATEGORIES = [
  { id: 'todos', label: 'Todos', emoji: '🎨' },
  ...TEMPLATE_CATEGORIES,
];

const SUBCATEGORIES: Record<string, { id: string; label: string }[]> = {
  alimentos: [
    { id: 'doces', label: 'Doces' },
    { id: 'naturais', label: 'Naturais' },
    { id: 'bebidas', label: 'Bebidas' },
  ],
  festas: [
    { id: 'aniversario', label: 'Aniversário' },
    { id: 'casamento', label: 'Casamento' },
    { id: 'cha-bebe', label: 'Chá de Bebê' },
  ],
  cosmeticos: [
    { id: 'skincare', label: 'Skincare' },
    { id: 'artesanal', label: 'Artesanal' },
  ],
};

const POPULAR_TAGS = [
  'artesanal', 'minimalista', 'luxo', 'natural',
  'colorido', 'elegante', 'vintage', 'moderno',
  'orgânico', 'infantil', 'botânico',
];

interface Props {
  filters: TemplateFilters;
  activeFilterCount: number;
  onUpdate: <K extends keyof TemplateFilters>(k: K, v: TemplateFilters[K]) => void;
  onToggleTag: (tag: string) => void;
  onReset: () => void;
  totalResults: number;
}

export function TemplateFiltersBar({
  filters, activeFilterCount, onUpdate,
  onToggleTag, onReset, totalResults,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const subcats = SUBCATEGORIES[filters.category] ?? [];

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Search + advanced toggle */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar template..."
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

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`relative flex items-center gap-1 px-2.5 py-1.5
                     rounded-lg text-xs border transition-colors
                     ${showAdvanced
                       ? 'bg-primary text-primary-foreground border-primary'
                       : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              onUpdate('category', cat.id);
              onUpdate('subcategory', '');
            }}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1
                       rounded-full text-[10px] font-medium transition-all
                       ${filters.category === cat.id
                         ? 'bg-primary text-primary-foreground shadow-sm'
                         : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Subcategories */}
      {subcats.length > 0 && (
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => onUpdate('subcategory', '')}
            className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] transition-all
                       ${!filters.subcategory
                         ? 'bg-accent text-foreground'
                         : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
          >
            Todos
          </button>
          {subcats.map((sub) => (
            <button
              key={sub.id}
              onClick={() => onUpdate('subcategory', sub.id)}
              className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] transition-all
                         ${filters.subcategory === sub.id
                           ? 'bg-accent text-foreground'
                           : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Advanced panel */}
      {showAdvanced && (
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-muted border border-border">
          {/* Sort */}
          <div>
            <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Ordenar por</span>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { id: 'az' as SortOrder, label: 'A → Z', icon: <ArrowUpAZ className="w-3 h-3" /> },
                { id: 'za' as SortOrder, label: 'Z → A', icon: <ArrowDownAZ className="w-3 h-3" /> },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdate('sortOrder', opt.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-colors
                             ${filters.sortOrder === opt.id
                               ? 'bg-primary/20 text-primary border-primary/30'
                               : 'bg-background text-muted-foreground border-border hover:bg-accent'}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Premium filter */}
          <div>
            <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">Plano</span>
            <div className="flex gap-1.5">
              {([
                { id: 'all' as PremiumFilter, label: 'Todos' },
                { id: 'free' as PremiumFilter, label: 'Grátis' },
                { id: 'premium' as PremiumFilter, label: '⭐ Pro' },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdate('premium', opt.id)}
                  className={`flex-1 py-1 rounded-lg text-[10px] border transition-colors
                             ${filters.premium === opt.id
                               ? 'bg-primary/20 text-primary border-primary/30'
                               : 'bg-background text-muted-foreground border-border hover:bg-accent'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Tag className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Tags</span>
              {filters.tags.length > 0 && (
                <span className="text-[8px] bg-primary/20 text-primary px-1.5 rounded-full">
                  {filters.tags.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={`px-2 py-0.5 rounded-full text-[9px] border transition-all
                             ${filters.tags.includes(tag)
                               ? 'bg-primary/20 text-primary border-primary/30'
                               : 'bg-background text-muted-foreground border-border hover:bg-accent'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results + clear */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </span>
            {activeFilterCount > 0 && (
              <button onClick={onReset} className="flex items-center gap-1 text-[10px] text-destructive hover:underline">
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
