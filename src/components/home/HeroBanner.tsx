import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useBanners } from '@/hooks/use-home-data';

const HeroBanner = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);
  const [selected, setSelected] = useState(0);
  const { getSetting } = useSettings();
  const { data: banners } = useBanners();

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
            {getSetting('home_hero_title') || <>Sua mensagem com<br /><span className="text-primary">impacto visual</span></>}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            {getSetting('home_hero_subtitle') || 'Adesivos, banners, placas, fachadas e muito mais. Soluções completas em comunicação visual para sua empresa em Limeira e região.'}
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

  const slides = banners?.length ? banners.map((b, idx) => (
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

export default HeroBanner;
