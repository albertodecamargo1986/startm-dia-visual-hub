import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default PortfolioPreviewSection;
