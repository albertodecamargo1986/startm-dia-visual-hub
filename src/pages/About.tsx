import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const About = () => (
  <div className="container py-12">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-5xl mb-6">Sobre a <span className="text-primary">StartMídia</span></h1>
      <p className="text-muted-foreground text-lg max-w-3xl mb-12">
        A StartMídia é uma empresa de comunicação visual localizada em Limeira/SP, especializada em soluções gráficas 
        que transformam a identidade visual dos nossos clientes em resultados impactantes.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <Card className="p-8 bg-card border-border">
        <h2 className="font-display text-3xl text-accent mb-4">Nossa Missão</h2>
        <p className="text-muted-foreground">Entregar soluções em comunicação visual com qualidade, agilidade e preços competitivos, ajudando empresas a comunicarem suas marcas de forma impactante.</p>
      </Card>
      <Card className="p-8 bg-card border-border">
        <h2 className="font-display text-3xl text-accent mb-4">Nossos Valores</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>• Qualidade em cada detalhe</li>
          <li>• Compromisso com prazos</li>
          <li>• Atendimento personalizado</li>
          <li>• Inovação constante</li>
        </ul>
      </Card>
    </div>

    <div>
      <h2 className="font-display text-3xl mb-6">O que <span className="text-primary">fazemos</span></h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Adesivos personalizados', 'Banners e lonas', 'Placas de sinalização', 'Fachadas em ACM', 'Envelopamento veicular', 'Etiquetas e rótulos'].map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
              <h3 className="font-semibold text-foreground">{s}</h3>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default About;
