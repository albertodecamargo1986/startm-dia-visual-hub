import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

const portfolioItems = [
  { title: 'Fachada Comercial', category: 'Fachadas e ACM', desc: 'Projeto completo de fachada em ACM com letras caixa.' },
  { title: 'Envelopamento de Frota', category: 'Envelopamento', desc: 'Envelopamento parcial de frota comercial.' },
  { title: 'Sinalização Industrial', category: 'Placas', desc: 'Sinalização completa de ambiente industrial.' },
  { title: 'Banner Promocional', category: 'Banners', desc: 'Banner de grande formato para evento.' },
  { title: 'Adesivos Decorativos', category: 'Adesivos', desc: 'Adesivos decorativos para vitrine de loja.' },
  { title: 'Rótulos de Produto', category: 'Etiquetas', desc: 'Desenvolvimento de rótulos personalizados.' },
];

const Portfolio = () => (
  <div className="container py-12">
    <h1 className="font-display text-5xl mb-4">Nosso <span className="text-primary">Portfólio</span></h1>
    <p className="text-muted-foreground text-lg mb-10">Conheça alguns dos nossos trabalhos realizados.</p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {portfolioItems.map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-colors group">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <span className="text-muted-foreground font-display text-xl">{item.category}</span>
            </div>
            <div className="p-4">
              <span className="text-xs text-primary">{item.category}</span>
              <h3 className="font-semibold text-foreground mt-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Portfolio;
