import {
  ArrowRight, Star, Sun, Phone,
} from 'lucide-react';
import type { SvgCategory } from './types';

export const SVG_ELEMENTS_LIBRARY: SvgCategory[] = [
  {
    id: 'arrows', label: 'Setas', icon: <ArrowRight className="h-3 w-3" />,
    elements: [
      { id: 'arrow-right', name: 'Seta Direita', path: 'M5 12h14M12 5l7 7-7 7' },
      { id: 'arrow-up-right', name: 'Seta Diagonal', path: 'M7 17L17 7M17 7H7M17 7v10' },
      { id: 'arrow-double', name: 'Seta Dupla', path: 'M5 12h14M12 5l7 7-7 7M2 12l5-5M2 12l5 5' },
      { id: 'chevron-right', name: 'Chevron', path: 'M9 18l6-6-6-6' },
      { id: 'arrow-thick', name: 'Seta Grossa', path: 'M4 12h12M12 4l8 8-8 8' },
      { id: 'move-right', name: 'Seta Movimento', path: 'M5 12h14M15 8l4 4-4 4' },
    ]
  },
  {
    id: 'symbols', label: 'Símbolos', icon: <Star className="h-3 w-3" />,
    elements: [
      { id: 'star-5', name: 'Estrela', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { id: 'heart', name: 'Coração', path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' },
      { id: 'lightning', name: 'Raio', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      { id: 'diamond', name: 'Diamante', path: 'M12 2L2 12l10 10 10-10L12 2z' },
      { id: 'crown', name: 'Coroa', path: 'M2 18l3-8 4 4 3-10 3 10 4-4 3 8H2z' },
      { id: 'medal', name: 'Medalha', path: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12' },
      { id: 'check-circle', name: 'Check', path: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
      { id: 'x-circle', name: 'Xis', path: 'M12 22a10 10 0 100-20 10 10 0 000 20zM15 9l-6 6M9 9l6 6' },
    ]
  },
  {
    id: 'decorative', label: 'Decorativos', icon: <Sun className="h-3 w-3" />,
    elements: [
      { id: 'sun', name: 'Sol', path: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' },
      { id: 'droplet', name: 'Gota', path: 'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z' },
      { id: 'leaf', name: 'Folha', path: 'M11 20A7 7 0 019.8 6.9C15.5 4.9 20 1 20 1s-2.3 7.4-5 11.5c-2 3-4 4.5-4 7.5z' },
      { id: 'flower', name: 'Flor', path: 'M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3-4-3-7.5c0 3.5-1 5.9-3 7.5S5 13 5 15a7 7 0 007 7z' },
      { id: 'sparkle', name: 'Brilho', path: 'M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z' },
      { id: 'wave', name: 'Onda', path: 'M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0' },
    ]
  },
  {
    id: 'icons', label: 'Ícones', icon: <Phone className="h-3 w-3" />,
    elements: [
      { id: 'phone', name: 'Telefone', path: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z' },
      { id: 'email', name: 'Email', path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
      { id: 'location', name: 'Localização', path: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z' },
      { id: 'cart', name: 'Carrinho', path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
      { id: 'instagram', name: 'Instagram', path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zM12 8a4 4 0 100 8 4 4 0 000-8zM17.5 6.5h.01' },
      { id: 'facebook', name: 'Facebook', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
    ]
  },
];
