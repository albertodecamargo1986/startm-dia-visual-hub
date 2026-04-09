import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export const WhatsAppFloat = () => {
  const { getSetting } = useSettings();
  const number = getSetting('whatsapp_number', '5519983649875');
  const message = encodeURIComponent(getSetting('whatsapp_message', 'Olá! Gostaria de solicitar um orçamento.'));

  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-0 rounded-full bg-green-500 shadow-lg hover:shadow-green-500/30 transition-all duration-300"
      aria-label="Orçamento pelo WhatsApp"
    >
      <span className="flex h-14 w-14 items-center justify-center shrink-0">
        <MessageCircle className="h-7 w-7 text-white" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-white transition-all duration-300 group-hover:max-w-48 group-hover:pr-5">
        Orçamento pelo WhatsApp
      </span>
    </a>
  );
};
