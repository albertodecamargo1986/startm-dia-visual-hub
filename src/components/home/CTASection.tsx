import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';

const CTASection = () => {
  const { getSetting } = useSettings();
  const whatsappNumber = getSetting('whatsapp_number', '5519983649875');
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Gostaria de fazer um orçamento.')}`;

  return (
    <section className="py-20 bg-primary">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-3xl md:text-5xl text-primary-foreground mb-4">
            Pronto para dar vida à sua ideia?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
            Solicite seu orçamento agora mesmo. Atendimento rápido e personalizado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="font-display text-lg tracking-wider">
                <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
              </Button>
            </a>
            <Link to="/produtos">
              <Button size="lg" variant="outline" className="font-display text-lg tracking-wider border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                Ver Produtos <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
