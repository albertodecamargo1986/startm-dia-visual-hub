import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sticker, Flag, SignpostBig, Tag, Building2, Car, Pen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/hooks/use-home-data';

const iconMap: Record<string, React.ElementType> = { Sticker, Flag, SignpostBig, Tag, Building2, Car, Pen };

const CategoriesSection = () => {
  const { data: categories } = useCategories();

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

export default CategoriesSection;
