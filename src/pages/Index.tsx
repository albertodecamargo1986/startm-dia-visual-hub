import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sticker, Flag, SignpostBig, Tag, Building2, Car, Pen, Trophy, Zap, DollarSign, Palette, Package, Handshake, Star, Quote, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import type { Banner, Category, Product } from '@/types';

const iconMap: Record<string, React.ElementType> = { Sticker, Flag, SignpostBig, Tag, Building2, Car, Pen };

const HeroBanner = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);
  const [selected, setSelected] = useState(0);
  const { getSetting } = useSettings();

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
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const whatsappNumber = getSetting('whatsapp_number', '5519983649875');
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Gostaria de fazer um orçamento.')}`;

  const fallbackSlide = (
    <div className="relative min-w-0 flex-[0_0_100%]">
      <div className="relative flex items-center justify-center min-h-[600px] bg-gradient-to-br from-secondary to-background">
        <div className="relative container text-center z-10 px-4">
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">
            Sua mensagem com<br /><span className="text-primary">impacto visual</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Adesivos, banners, placas, fachadas e muito mais. Soluções completas em comunicação visual para sua empresa em Limeira e região.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/produtos">
              <Button size="lg" className="font-display text-lg tracking-wider">
                Ver Produtos <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="font-display text-lg tracking-wider border-green-500 text-green-500 hover:bg-green-500/10">
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const slides = banners?.length ? banners.map(b => (
    <div key={b.id} className="relative min-w-0 flex-[0_0_100%]">
      <div
        className="relative flex items-center justify-center min-h-[600px] bg-secondary"
        style={b.image_url ? { backgroundImage: `url(${b.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative container text-center z-10 px-4">
          {b.title && <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground mb-4">{b.title}</h2>}
          {b.subtitle && <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">{b.subtitle}</p>}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {b.link_url && b.button_text && (
              <Link to={b.link_url}>
                <Button size="lg" className="font-display text-lg tracking-wider">{b.button_text}</Button>
              </Link>
            )}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="font-display text-lg tracking-wider border-green-500 text-green-500 hover:bg-green-500/10">
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )) : [fallbackSlide];

  return (
    <section className="relative overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">{slides}</div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/60 backdrop-blur flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/60 backdrop-blur flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${i === selected ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
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
    <section className="py-20">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
          Nossos <span className="text-primary">Produtos e Serviços</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories?.map((c, i) => {
            const Icon = iconMap[c.icon ?? ''] ?? Sticker;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link to={`/produtos/${c.slug}`}>
                  <Card className="group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer bg-card border-border">
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                        <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      <span className="text-sm font-semibold text-center text-foreground">{c.name}</span>
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1 });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('featured', true).eq('active', true).limit(12);
      return (data ?? []) as Product[];
    },
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  if (!products?.length) return null;

  return (
    <section className="py-20 bg-card/50">
      <div className="container">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-display text-4xl md:text-5xl">
            Produtos em <span className="text-primary">Destaque</span>
          </h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex -ml-4">
            {products.map(p => (
              <div key={p.id} className="min-w-0 flex-[0_0_80%] sm:flex-[0_0_45%] lg:flex-[0_0_25%] pl-4">
                <Link to={`/produto/${p.slug}`}>
                  <Card className="group overflow-hidden hover:border-primary/50 transition-colors bg-card border-border h-full">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <Sticker className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                      {Number(p.base_price) > 0 && (
                        <p className="mt-2 text-primary font-bold">
                          R$ {Number(p.base_price).toFixed(2).replace('.', ',')}
                          <span className="text-xs text-muted-foreground font-normal ml-1">/ {p.price_unit}</span>
                        </p>
                      )}
                      <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                        Ver Produto <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link to="/produtos">
            <Button variant="outline" className="font-display text-lg tracking-wider">
              Ver Todos os Produtos <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const differentials = [
  { icon: Trophy, title: 'Qualidade Premium', desc: 'Impressão de alta resolução, materiais duráveis e acabamento impecável.' },
  { icon: Zap, title: 'Entrega Rápida', desc: 'Prazo a partir de 1 dia útil dependendo do produto.' },
  { icon: DollarSign, title: 'Melhor Preço', desc: 'Orçamento sem compromisso, preços competitivos da região.' },
  { icon: Palette, title: 'Arte Inclusa', desc: 'Equipe de design para ajudar na criação da sua arte.' },
  { icon: Package, title: 'Pedido Online', desc: 'Faça seu pedido 24h pelo site, de qualquer lugar.' },
  { icon: Handshake, title: 'Atendimento Personalizado', desc: 'Suporte via WhatsApp durante todo o processo.' },
];

const DifferentialsSection = () => (
  <section className="py-20">
    <div className="container">
      <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
        Por que escolher a <span className="text-primary">StartMídia</span>?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {differentials.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="p-6 bg-card border-border h-full hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const portfolioItems = [
  { title: 'Fachada Comercial', category: 'Fachadas e ACM', aspect: 'aspect-video' },
  { title: 'Envelopamento de Frota', category: 'Envelopamento', aspect: 'aspect-square' },
  { title: 'Sinalização Industrial', category: 'Placas', aspect: 'aspect-[4/3]' },
  { title: 'Banner Promocional', category: 'Banners', aspect: 'aspect-video' },
  { title: 'Adesivos Decorativos', category: 'Adesivos', aspect: 'aspect-[4/3]' },
  { title: 'Rótulos de Produto', category: 'Etiquetas', aspect: 'aspect-square' },
  { title: 'Letras Caixa Iluminadas', category: 'Fachadas e ACM', aspect: 'aspect-video' },
  { title: 'Placas de Obra', category: 'Placas', aspect: 'aspect-[4/3]' },
];

const PortfolioPreviewSection = () => (
  <section className="py-20 bg-card/50">
    <div className="container">
      <h2 className="font-display text-4xl md:text-5xl text-center mb-12">
        Confira Nossos <span className="text-primary">Trabalhos</span>
      </h2>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {portfolioItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="break-inside-avoid"
          >
            <div className={`group relative overflow-hidden rounded-xl ${item.aspect} bg-muted`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-muted-foreground font-display text-lg">{item.category}</span>
              </div>
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                <span className="text-xs text-primary font-semibold uppercase tracking-wider">{item.category}</span>
                <span className="text-foreground font-display text-lg mt-1 text-center">{item.title}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="text-center mt-10">
        <Link to="/portfolio">
          <Button variant="outline" className="font-display text-lg tracking-wider">
            Ver Portfolio Completo <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

const testimonials = [
  { name: 'Carlos Mendes', company: 'Auto Peças Limeira', text: 'Excelente qualidade nos adesivos e banners! Sempre entregam no prazo e com acabamento impecável. Recomendo demais!', stars: 5, initials: 'CM' },
  { name: 'Fernanda Oliveira', company: 'Clínica Bem Estar', text: 'A fachada em ACM ficou maravilhosa. A equipe foi super atenciosa desde o projeto até a instalação. Nota 10!', stars: 5, initials: 'FO' },
  { name: 'Ricardo Santos', company: 'RS Construções', text: 'Fizemos todas as placas de sinalização da obra com a StartMídia. Preço justo e qualidade profissional.', stars: 5, initials: 'RS' },
  { name: 'Mariana Costa', company: 'Doceria da Mari', text: 'Os rótulos e etiquetas dos meus produtos ficaram lindos! Ajudaram muito no design também. Super parceiros!', stars: 4, initials: 'MC' },
  { name: 'André Lima', company: 'Lima Transportes', text: 'Envelopamos toda a frota com eles. Serviço rápido, material de primeira e atendimento nota mil.', stars: 5, initials: 'AL' },
];

const TestimonialsSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 4000, stopOnInteraction: true })]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl tracking-wider">
            O que nossos <span className="text-primary">clientes</span> dizem
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            A satisfação dos nossos clientes é o nosso maior orgulho
          </p>
        </motion.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4"
              >
                <Card className="h-full bg-card border-border/50">
                  <CardContent className="p-6 flex flex-col h-full">
                    <Quote className="h-8 w-8 text-primary/30 mb-3" />
                    <p className="text-muted-foreground italic flex-1 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-1 mt-4 mb-3">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className={`h-4 w-4 ${s < t.stars ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{t.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === selectedIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Index = () => (
  <>
    <Helmet>
      <title>StartMídia Comunicação Visual | Banners, Adesivos, Placas em Limeira/SP</title>
      <meta name="description" content="Gráfica e comunicação visual em Limeira/SP. Banners, lonas, adesivos, placas de sinalização, etiquetas, rótulos, envelopamento e fachadas com altíssima qualidade. Orçamento rápido!" />
      <meta name="keywords" content="gráfica Limeira, comunicação visual Limeira, banner Limeira, adesivo Limeira, placa sinalização Limeira, etiqueta rótulo Limeira, envelopamento veículo Limeira, fachada ACM Limeira" />
      <meta property="og:title" content="StartMídia Comunicação Visual — Limeira/SP" />
      <meta property="og:description" content="Sua mensagem com impacto visual. Banners, lonas, adesivos, placas, etiquetas e muito mais." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://startmidialimeira.com.br" />
      <link rel="canonical" href="https://startmidialimeira.com.br" />
    </Helmet>
    <HeroBanner />
    <CategoriesSection />
    <FeaturedProducts />
    <DifferentialsSection />
    <PortfolioPreviewSection />
    <TestimonialsSection />
  </>
);

export default Index;
