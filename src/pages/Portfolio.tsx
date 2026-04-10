import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const fallbackItems = [
  { id: '1', title: 'Fachada Comercial', category: 'Fachadas', image_url: '', description: 'Projeto completo de fachada em ACM com letras caixa.' },
  { id: '2', title: 'Envelopamento de Frota', category: 'Envelopamento', image_url: '', description: 'Envelopamento parcial de frota comercial.' },
  { id: '3', title: 'Sinalização Industrial', category: 'Placas', image_url: '', description: 'Sinalização completa de ambiente industrial.' },
  { id: '4', title: 'Banner Promocional', category: 'Banners', image_url: '', description: 'Banner de grande formato para evento.' },
  { id: '5', title: 'Adesivos Decorativos', category: 'Adesivos', image_url: '', description: 'Adesivos decorativos para vitrine de loja.' },
  { id: '6', title: 'Rótulos de Produto', category: 'Etiquetas', image_url: '', description: 'Desenvolvimento de rótulos personalizados.' },
];

const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: dbItems } = useQuery({
    queryKey: ['portfolio-items'],
    queryFn: async () => {
      const { data } = await supabase.from('portfolio_items').select('*').eq('active', true).order('item_order');
      return data ?? [];
    },
  });

  const items = (dbItems && dbItems.length > 0 ? dbItems : fallbackItems);
  const categories = ['Todos', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];
  const filtered = activeCategory === 'Todos' ? items : items.filter(i => i.category === activeCategory);

  const navigate = useCallback((dir: 1 | -1) => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + dir + filtered.length) % filtered.length);
  }, [lightboxIndex, filtered.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, navigate]);

  return (
    <>
      <Helmet>
        <title>Portfólio StartMídia — Trabalhos de Comunicação Visual em Limeira/SP</title>
        <meta name="description" content="Veja nossos trabalhos de comunicação visual: fachadas, banners, adesivos, envelopamento veicular e muito mais. Gráfica em Limeira/SP." />
        <link rel="canonical" href="https://startmidialimeira.com.br/portfolio" />
      </Helmet>

      <div className="container py-12">
        <h1 className="font-display text-5xl mb-4">Nosso <span className="text-primary">Portfólio</span></h1>
        <p className="text-muted-foreground text-lg mb-8">Conheça alguns dos nossos trabalhos realizados.</p>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              className="break-inside-avoid mb-4 cursor-pointer group relative overflow-hidden rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setLightboxIndex(i)}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className={`w-full bg-muted flex items-center justify-center ${i % 3 === 0 ? 'aspect-video' : i % 3 === 1 ? 'aspect-square' : 'aspect-[3/4]'}`}>
                  <span className="text-muted-foreground font-display text-lg">{item.category}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                <span className="text-xs text-primary font-medium">{item.category}</span>
                <h3 className="font-display text-lg text-foreground mt-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 border-border">
          {lightboxIndex !== null && filtered[lightboxIndex] && (
            <div className="relative flex flex-col items-center justify-center min-h-[60vh] p-6">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10" onClick={() => setLightboxIndex(null)}>
                <X className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => navigate(1)}>
                <ChevronRight className="h-6 w-6" />
              </Button>

              {filtered[lightboxIndex].image_url ? (
                <img src={filtered[lightboxIndex].image_url} alt={filtered[lightboxIndex].title} className="max-h-[70vh] object-contain rounded" />
              ) : (
                <div className="w-full max-w-lg aspect-video bg-muted rounded flex items-center justify-center">
                  <span className="font-display text-2xl text-muted-foreground">{filtered[lightboxIndex].category}</span>
                </div>
              )}

              <div className="text-center mt-4">
                <span className="text-xs text-primary">{filtered[lightboxIndex].category}</span>
                <h3 className="font-display text-xl text-foreground">{filtered[lightboxIndex].title}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{filtered[lightboxIndex].description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Portfolio;
