import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Clock } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/types';

export const Footer = () => {
  const { getSetting } = useSettings();

  const { data: categories } = useQuery({
    queryKey: ['footer-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('name, slug').eq('active', true).order('cat_order');
      return (data ?? []) as Pick<Category, 'name' | 'slug'>[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const whatsappNumber = getSetting('whatsapp_number', '5519983649875');

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Empresa */}
        <div>
          <Link to="/" className="inline-block mb-4">
            {(getSetting('site_logo_footer') || getSetting('site_logo_url')) ? (
              <img src={getSetting('site_logo_footer') || getSetting('site_logo_url')} alt="StartMídia" className="h-12 w-auto" />
            ) : (
              <span className="font-display text-2xl text-primary">STARTMÍDIA</span>
            )}
          </Link>
          <p className="text-sm text-muted-foreground mb-4">
            Sua mensagem com impacto visual. Comunicação visual profissional em Limeira/SP.
          </p>
          <div className="flex gap-3">
            {getSetting('instagram_url') && (
              <a href={getSetting('instagram_url')} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {getSetting('facebook_url') && (
              <a href={getSetting('facebook_url')} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full bg-muted/20 flex items-center justify-center hover:bg-green-500/20 hover:text-green-400 transition-colors">
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Produtos */}
        <div>
          <h4 className="font-display text-lg mb-4">Produtos</h4>
          <div className="space-y-2">
            {categories?.map(cat => (
              <Link key={cat.slug} to={`/produtos/${cat.slug}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Atendimento */}
        <div>
          <h4 className="font-display text-lg mb-4">Atendimento</h4>
          <div className="space-y-3 text-sm text-muted-foreground">
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-green-400 transition-colors">
              <Phone className="h-4 w-4 shrink-0 text-green-400" />WhatsApp
            </a>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" />{getSetting('telefone_alberto', '(19) 98364-9875')}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" />{getSetting('telefone_felipe', '(19) 98163-1066')}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />{getSetting('email_contato', 'contato@startmidia.com.br')}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />{getSetting('endereco', 'Limeira/SP')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />{getSetting('horario', 'Seg-Sex 8h às 18h')}
            </div>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-display text-lg mb-4">Links</h4>
          <div className="space-y-2">
            <Link to="/sobre" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Sobre</Link>
            <Link to="/portfolio" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Portfólio</Link>
            <Link to="/contato" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contato</Link>
            <Link to="/cliente" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Área do Cliente</Link>
            <Link to="/privacidade" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border/30 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} StartMídia Comunicação Visual. Todos os direitos reservados.
      </div>
    </footer>
  );
};
