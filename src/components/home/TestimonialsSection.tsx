import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';

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

export default TestimonialsSection;
