import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { LABEL_TEMPLATES, type LabelTemplate } from '@/lib/label-templates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: LabelTemplate) => void;
}

const CATEGORIES = [
  { id: 'todos', label: 'Todos', icon: '🎨' },
  { id: 'produtos', label: 'Produtos', icon: '🛍️' },
  { id: 'alimentos', label: 'Alimentos', icon: '🍰' },
  { id: 'cosmeticos', label: 'Cosméticos', icon: '💄' },
  { id: 'festas', label: 'Festas', icon: '🎉' },
  { id: 'botanico', label: 'Botânico', icon: '🌿' },
  { id: 'escolar', label: 'Escolar', icon: '✏️' },
  { id: 'empresarial', label: 'Empresarial', icon: '💼' },
  { id: 'vintage', label: 'Vintage', icon: '📜' },
  { id: 'minimalista', label: 'Minimalista', icon: '⬜' },
  { id: 'premium', label: 'Premium', icon: '✨' },
  { id: 'promocional', label: 'Promocional', icon: '🏷️' },
  { id: 'artesanal', label: 'Artesanal', icon: '🧶' },
  { id: 'festivo', label: 'Festivo', icon: '🎄' },
  { id: 'elegante', label: 'Elegante', icon: '💎' },
  { id: 'moderno', label: 'Moderno', icon: '⬡' },
];

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');

  const filteredTemplates = useMemo(() => {
    return LABEL_TEMPLATES.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(q) ||
        (t.tags && t.tags.some((tag) => tag.includes(q)));
      const matchesCategory =
        activeCategory === 'todos' || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

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

      {/* Categories (horizontal scroll) */}
      <div className="flex gap-1.5 p-2 overflow-x-auto border-b border-border">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1
                       text-[10px] rounded-full transition-colors
                       ${activeCategory === cat.id
                         ? 'bg-primary text-primary-foreground'
                         : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelectTemplate(template)}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8">
            Nenhum template encontrado
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: LabelTemplate;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onSelect}
      className="group relative rounded-lg overflow-hidden border border-border
                 hover:border-primary transition-all hover:scale-[1.03] aspect-square bg-muted"
    >
      {template.thumbnail && !imgError ? (
        <img
          src={template.thumbnail}
          alt={template.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-2xl opacity-40">🏷️</span>
        </div>
      )}

      {template.premium && (
        <span className="absolute top-1 right-1 bg-yellow-500 text-black
                        text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          PRO
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm px-2 py-1
                      translate-y-full group-hover:translate-y-0 transition-transform">
        <p className="text-foreground text-[10px] text-center truncate">
          {template.name}
        </p>
      </div>
    </button>
  );
}

export default TemplateGallery;
