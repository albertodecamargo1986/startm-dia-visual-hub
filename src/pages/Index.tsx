import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sticker, Flag, SignpostBig, Tag, Building2, Car, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import type { Banner, Category, Product } from '@/types';

const iconMap: Record<string, React.ElementType> = { Sticker, Flag, SignpostBig, Tag, Building2, Car, Pen };

const HeroBanner = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').eq('active', true).order('banner_order');
      return (data ?? []) as Banner[];
    },
  });

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => { clearInterval(interval); emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  if (!banners?.length) {
    return (
      <section className="relative flex items-center justify-center bg-secondary py-24 md:py-32">
        <div className="container text-center">
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">Sua mensagem com<br /><span className="text-primary">impacto visual</span></h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">Adesivos, banners, placas, fachadas e muito mais. Soluções completas em comunicação visual para sua empresa.</p>
          <Link to="/produtos"><Button size="lg" className="font-display text-lg tracking-wider">Ver Produtos <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map(b => (
            <div key={b.id} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative flex items-center justify-center bg-secondary py-24 md:py-32"
                style={{ backgroundImage: `url(${b.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-background/70" />
                <div className="relative container text-center z-10">
                  {b.title && <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">{b.title}</h2>}
                  {b.subtitle && <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">{b.subtitle}</p>}
                  {b.link_url && b.button_text && (
                    <Link to={b.link_url}><Button size="lg" className="font-display text-lg tracking-wider">{b.button_text}</Button></Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2 w-2 rounded-full transition-colors ${i === selected ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
        ))}
      </div>
    </section>
  );
};

const CategoriesSection = () => {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('active', true).order('cat_order');
      return (data ?? []) as Category[];
    },
  });

  return (
    <section className="py-16">
      <div className="container">
        <h2 className="font-display text-4xl text-center mb-10">Nossas <span className="text-primary">Especialidades</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories?.map((c, i) => {
            const Icon = iconMap[c.icon ?? ''] ?? Sticker;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={`/produtos/${c.slug}`}>
                  <Card className="group hover:border-primary/50 transition-colors cursor-pointer bg-card border-border">
                    <CardContent className="flex flex-col items-center justify-center p-4 gap-3">
                      <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium text-center text-foreground">{c.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const FeaturedProducts = () => {
  const { data: products } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('featured', true).eq('active', true).limit(8);
      return (data ?? []) as Product[];
    },
  });

  if (!products?.length) return null;

  return (
    <section className="py-16 bg-card/50">
      <div className="container">
        <h2 className="font-display text-4xl text-center mb-10">Produtos em <span className="text-primary">Destaque</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to={`/produto/${p.slug}`}>
                <Card className="group overflow-hidden hover:border-primary/50 transition-colors bg-card border-border">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Sticker className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                    {Number(p.base_price) > 0 && (
                      <p className="mt-2 text-primary font-bold">R$ {Number(p.base_price).toFixed(2).replace('.', ',')} <span className="text-xs text-muted-foreground font-normal">/ {p.price_unit}</span></p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/produtos"><Button variant="outline" className="font-display text-lg tracking-wider">Ver Todos os Produtos <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </div>
    </section>
  );
};

const Index = () => (
  <>
    <HeroBanner />
    <CategoriesSection />
    <FeaturedProducts />
    <section className="py-16">
      <div className="container text-center">
        <h2 className="font-display text-4xl mb-6">Por que escolher a <span className="text-primary">StartMídia</span>?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {[
            { title: 'Qualidade Premium', desc: 'Materiais de primeira linha e acabamento impecável em todos os produtos.' },
            { title: 'Entrega Rápida', desc: 'Prazos competitivos sem comprometer a qualidade do material.' },
            { title: 'Atendimento Personalizado', desc: 'Equipe especializada para ajudar em cada etapa do seu projeto.' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}>
              <Card className="p-6 bg-card border-border">
                <h3 className="font-display text-2xl text-accent mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default Index;
