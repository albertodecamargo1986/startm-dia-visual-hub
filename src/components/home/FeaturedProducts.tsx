import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sticker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { useFeaturedProducts } from '@/hooks/use-home-data';
import { formatBRL } from '@/lib/format';

const FeaturedProducts = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1 });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const { data: products } = useFeaturedProducts();

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
                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" decoding="async" />
                      ) : (
                        <Sticker className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                      {Number(p.base_price) > 0 && (
                        <p className="mt-2 text-primary font-bold">
                          {formatBRL(Number(p.base_price))}
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

export default FeaturedProducts;
