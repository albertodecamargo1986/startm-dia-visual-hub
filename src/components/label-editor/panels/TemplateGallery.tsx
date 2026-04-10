import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { LABEL_TEMPLATES, TEMPLATE_CATEGORIES, type LabelTemplate } from '@/lib/label-templates';
import { useTemplateThumbnails } from '@/lib/template-thumbnail-generator';
import { mmToPx } from '@/lib/label-formats';

interface TemplateGalleryProps {
  onSelectTemplate: (template: LabelTemplate) => void;
  widthMm: number;
  heightMm: number;
}

export function TemplateGallery({ onSelectTemplate, widthMm, heightMm }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const widthPx = mmToPx(widthMm);
  const heightPx = mmToPx(heightMm);

  const thumbnails = useTemplateThumbnails(LABEL_TEMPLATES, widthPx, heightPx);

  const filtered = useMemo(() => {
    return LABEL_TEMPLATES.filter((t) => {
      const matchCat = category === 'todos' || t.category === category;
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(q) ||
        (t.tags && t.tags.some((tag) => tag.includes(q)));
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const allCategories = [
    { id: 'todos', label: 'Todos', emoji: '🎨' },
    ...TEMPLATE_CATEGORIES,
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <Input
          type="text"
          placeholder="Buscar template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 p-2 overflow-x-auto border-b border-border">
        {allCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1
                       text-[10px] rounded-full transition-all duration-150 font-medium
                       ${category === cat.id
                         ? 'bg-primary text-primary-foreground shadow-sm'
                         : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl)}
              onMouseEnter={() => setHoveredId(tpl.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative rounded-lg overflow-hidden border border-border
                         aspect-square hover:border-primary hover:shadow-md
                         transition-all duration-200 hover:scale-[1.03]
                         group bg-muted"
            >
              {thumbnails[tpl.id] ? (
                <img
                  src={thumbnails[tpl.id]}
                  alt={tpl.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
                    <span className="text-[9px] text-muted-foreground mt-1 block">gerando...</span>
                  </div>
                </div>
              )}

              {tpl.premium && (
                <span className="absolute top-1 right-1 bg-yellow-500 text-black
                                text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm
                              px-2 py-1.5 translate-y-full group-hover:translate-y-0
                              transition-transform duration-200">
                <p className="text-foreground text-[10px] text-center truncate font-medium">
                  {tpl.name}
                </p>
                <p className="text-[9px] text-muted-foreground text-center">
                  Usar template
                </p>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <span className="text-2xl block mb-2">🎨</span>
            <span className="text-xs text-muted-foreground">Nenhum template encontrado</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplateGallery;
