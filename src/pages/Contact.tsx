import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1, 'Mensagem é obrigatória').max(2000),
});

const Contact = () => {
  const { getSetting } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    const whatsappNumber = getSetting('whatsapp_number', '5519983649875');
    const msg = encodeURIComponent(`*Contato via Site*\nNome: ${form.name}\nEmail: ${form.email}\nTelefone: ${form.phone}\n\n${form.message}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
    toast.success('Redirecionando para o WhatsApp!');
  };

  return (
    <div className="container py-12">
      <h1 className="font-display text-5xl mb-4">Fale <span className="text-primary">Conosco</span></h1>
      <p className="text-muted-foreground text-lg mb-10">Solicite um orçamento ou tire suas dúvidas.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input placeholder="Seu nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Input type="email" placeholder="Seu email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <Input placeholder="Telefone (opcional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <div>
              <Textarea placeholder="Sua mensagem ou descrição do pedido" rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
            </div>
            <Button type="submit" className="w-full font-display text-lg tracking-wider">
              <MessageCircle className="mr-2 h-5 w-5" /> Enviar via WhatsApp
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <h2 className="font-display text-2xl mb-4">Informações de Contato</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /><div><p className="text-foreground">Alberto Camargo</p><p className="text-muted-foreground">{getSetting('telefone_alberto')}</p></div></div>
              <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /><div><p className="text-foreground">Felipe Santos</p><p className="text-muted-foreground">{getSetting('telefone_felipe')}</p></div></div>
              <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /><span className="text-muted-foreground">{getSetting('email_contato')}</span></div>
              <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><span className="text-muted-foreground">{getSetting('endereco')}</span></div>
            </div>
          </Card>
          <Card className="p-6 bg-card border-border">
            <h2 className="font-display text-2xl mb-2">Horário de Atendimento</h2>
            <p className="text-sm text-muted-foreground">Segunda a Sexta: 8h às 18h</p>
            <p className="text-sm text-muted-foreground">Sábado: 8h às 12h</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;
