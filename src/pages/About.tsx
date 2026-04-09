import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import {
  Phone, Mail, Sticker, Flag, Signpost, RectangleHorizontal,
  Car, Tag, Award, Users, FolderOpen, MessageCircle
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }) };

const stats = [
  { label: 'Anos de experiência', value: '10+' },
  { label: 'Clientes atendidos', value: '500+' },
  { label: 'Projetos realizados', value: '3.000+' },
];

const specialties = [
  { icon: Sticker, title: 'Adesivos Personalizados', desc: 'Adesivos em vinil, transparentes, perfurados e especiais.' },
  { icon: Flag, title: 'Banners e Lonas', desc: 'Impressão de alta resolução em lona front/backlight.' },
  { icon: Signpost, title: 'Placas de Sinalização', desc: 'Placas em ACM, PS, PVC e alumínio composto.' },
  { icon: RectangleHorizontal, title: 'Fachadas em ACM', desc: 'Fachadas completas com letras caixa e iluminação.' },
  { icon: Car, title: 'Envelopamento Veicular', desc: 'Envelopamento total ou parcial de veículos e frotas.' },
  { icon: Tag, title: 'Etiquetas e Rótulos', desc: 'Rótulos adesivos personalizados para produtos.' },
];

const About = () => {
  const { getSetting } = useSettings();

  return (
    <>
      <Helmet>
        <title>Sobre a StartMídia | Gráfica em Limeira/SP</title>
        <meta name="description" content="Conheça a StartMídia, empresa de comunicação visual em Limeira/SP. Especialistas em banners, adesivos, placas, fachadas e muito mais." />
      </Helmet>

      <div className="container py-12 space-y-20">
        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-5xl mb-4">Sobre a <span className="text-primary">StartMídia</span></h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {getSetting('about_intro') || 'A StartMídia é uma empresa de comunicação visual localizada em Limeira/SP, especializada em soluções gráficas que transformam a identidade visual dos nossos clientes em resultados impactantes. Com mais de 10 anos de experiência no mercado, atendemos empresas de todos os portes com qualidade e agilidade.'}
            </p>
          </div>
          <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground font-display text-2xl">Foto da Empresa</span>
          </div>
        </motion.section>

        {/* Nossa História + Stats */}
        <section>
          <h2 className="font-display text-3xl mb-8 text-center">Nossa <span className="text-primary">História</span></h2>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-10">
            {getSetting('about_history') || 'Fundada com o objetivo de oferecer soluções em comunicação visual com excelência, a StartMídia cresceu atuando lado a lado com seus clientes, entregando projetos que comunicam e vendem.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card className="p-8 text-center bg-card border-border">
                  <p className="font-display text-5xl text-primary">{s.value}</p>
                  <p className="text-muted-foreground mt-2">{s.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Nossa Equipe */}
        <section>
          <h2 className="font-display text-3xl mb-8 text-center">Nossa <span className="text-primary">Equipe</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              { name: 'Alberto Camargo', role: 'Sócio / Comercial', phoneKey: 'telefone_alberto' },
              { name: 'Felipe Santos', role: 'Sócio / Produção', phoneKey: 'telefone_felipe' },
            ].map((person, i) => (
              <motion.div key={person.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card className="p-6 bg-card border-border flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl text-foreground">{person.name}</h3>
                  <p className="text-sm text-primary">{person.role}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{getSetting(person.phoneKey)}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Especialidades */}
        <section>
          <h2 className="font-display text-3xl mb-8 text-center">Nossas <span className="text-primary">Especialidades</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialties.map((s, i) => (
              <motion.div key={s.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors h-full">
                  <s.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="font-display text-3xl mb-4">Pronto para <span className="text-primary">começar</span>?</h2>
          <p className="text-muted-foreground mb-6">Solicite um orçamento sem compromisso.</p>
          <Button asChild size="lg" className="font-display text-lg tracking-wider">
            <Link to="/contato"><MessageCircle className="mr-2 h-5 w-5" />Solicite um Orçamento</Link>
          </Button>
        </section>
      </div>
    </>
  );
};

export default About;
