import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export const WhatsAppButton = () => {
  const { getSetting } = useSettings();
  const number = getSetting('whatsapp_number', '5519983649875');
  const message = encodeURIComponent(getSetting('whatsapp_message', 'Olá! Gostaria de solicitar um orçamento.'));

  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg hover:bg-green-600 transition-colors"
      aria-label="Fale conosco pelo WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </a>
  );
};
