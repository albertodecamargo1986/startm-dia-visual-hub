import { motion } from 'framer-motion';
import { Trophy, Zap, DollarSign, Palette, Package, Handshake } from 'lucide-react';
import { Card } from '@/components/ui/card';

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

export default DifferentialsSection;
