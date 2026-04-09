import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export const Footer = () => {
  const { getSetting } = useSettings();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display text-2xl mb-4">
            <span className="text-primary">START</span>MÍDIA
          </h3>
          <p className="text-sm text-muted-foreground">Sua mensagem com impacto visual. Comunicação visual profissional em Limeira/SP.</p>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-foreground">Links</h4>
          <div className="space-y-2">
            <Link to="/produtos" className="block text-sm text-muted-foreground hover:text-foreground">Produtos</Link>
            <Link to="/sobre" className="block text-sm text-muted-foreground hover:text-foreground">Sobre</Link>
            <Link to="/portfolio" className="block text-sm text-muted-foreground hover:text-foreground">Portfólio</Link>
            <Link to="/contato" className="block text-sm text-muted-foreground hover:text-foreground">Contato</Link>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4 text-foreground">Contato</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{getSetting('telefone_alberto')}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{getSetting('telefone_felipe')}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{getSetting('email_contato')}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{getSetting('endereco')}</div>
            {getSetting('instagram_url') && (
              <a href={getSetting('instagram_url')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground">
                <Instagram className="h-4 w-4 text-primary" />Instagram
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} StartMídia Comunicação Visual. Todos os direitos reservados.
      </div>
    </footer>
  );
};
