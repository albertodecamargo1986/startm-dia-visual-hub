import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CheckoutSuccess = () => (
  <div className="container py-16 text-center">
    <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
    <h1 className="font-display text-5xl mb-4">Pedido Realizado!</h1>
    <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
      Seu pedido foi recebido com sucesso. Acompanhe o status na sua área de cliente.
    </p>
    <div className="flex gap-4 justify-center">
      <Link to="/cliente/pedidos"><Button className="font-display text-lg tracking-wider">Ver Meus Pedidos</Button></Link>
      <Link to="/"><Button variant="outline" className="font-display text-lg tracking-wider">Voltar ao Início</Button></Link>
    </div>
  </div>
);

export default CheckoutSuccess;
