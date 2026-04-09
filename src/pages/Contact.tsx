import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, MapPin, MessageCircle, Clock, Upload } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().max(20).optional(),
  product: z.string().optional(),
  message: z.string().trim().min(1, 'Mensagem é obrigatória').max(2000),
});

const Contact = () => {
  const { getSetting } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', product: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories-contact'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name').eq('active', true).order('cat_order');
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    let fileUrl = '';
    if (file) {
      const ext = file.name.split('.').pop();
      const path = `contact/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('customer-files').upload(path, file);
      if (!error) {
        fileUrl = path;
      }
    }

    await supabase.from('contact_requests').insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      product: form.product,
      message: form.message,
      file_url: fileUrl,
    });

    const whatsappNumber = getSetting('whatsapp_number', '5519983649875');
    const msg = encodeURIComponent(
      `*Orçamento via Site*\nNome: ${form.name}\nEmail: ${form.email}\nTelefone: ${form.phone}\nProduto: ${form.product}\n\n${form.message}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
    toast.success('Solicitação enviada! Redirecionando para o WhatsApp.');
    setForm({ name: '', email: '', phone: '', product: '', message: '' });
    setFile(null);
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Contato StartMídia — Orçamento Comunicação Visual Limeira/SP</title>
        <meta name="description" content="Solicite um orçamento de comunicação visual em Limeira/SP. Banners, adesivos, placas, fachadas e mais. Atendimento rápido via WhatsApp." />
      </Helmet>

      <div className="container py-12">
        <h1 className="font-display text-5xl mb-4">Fale <span className="text-primary">Conosco</span></h1>
        <p className="text-muted-foreground text-lg mb-10">Solicite um orçamento ou tire suas dúvidas.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="p-6 bg-card border-border">
            <h2 className="font-display text-2xl mb-4">Solicitar Orçamento</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input placeholder="Seu nome *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Input type="email" placeholder="Seu email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <Input placeholder="WhatsApp / Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />

              <Select value={form.product} onValueChange={v => setForm(p => ({ ...p, product: v }))}>
                <SelectTrigger><SelectValue placeholder="Produto de interesse" /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <Textarea placeholder="Descrição do projeto *" rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
                {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer border border-dashed border-border rounded-md p-3 hover:border-primary/50 transition-colors">
                  <Upload className="h-4 w-4" />
                  {file ? file.name : 'Arquivo de referência (opcional)'}
                  <input type="file" className="hidden" accept="image/*,.pdf,.ai,.cdr,.psd" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full font-display text-lg tracking-wider">
                <MessageCircle className="mr-2 h-5 w-5" />
                {loading ? 'Enviando...' : 'Enviar via WhatsApp'}
              </Button>
            </form>
          </Card>

          {/* Info side */}
          <div className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <h2 className="font-display text-2xl mb-4">Informações de Contato</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-medium">Alberto Camargo</p>
                    <p className="text-muted-foreground">{getSetting('telefone_alberto')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-medium">Felipe Santos</p>
                    <p className="text-muted-foreground">{getSetting('telefone_felipe')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{getSetting('email_contato')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{getSetting('endereco')}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h2 className="font-display text-2xl mb-2">
                <Clock className="inline h-5 w-5 mr-2 text-primary" />Horário de Atendimento
              </h2>
              <p className="text-sm text-muted-foreground">Segunda a Sexta: 8h às 18h</p>
              <p className="text-sm text-muted-foreground">Sábado: 8h às 12h</p>
            </Card>

            {/* Google Maps embed */}
            <Card className="overflow-hidden border-border">
              <iframe
                title="Localização StartMídia"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3679.0!2d-47.4!3d-22.56!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sLimeira%2C+SP!5e0!3m2!1spt-BR!2sbr!4v1"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Card>

            <Button
              className="w-full font-display text-lg tracking-wider"
              size="lg"
              onClick={() => {
                const num = getSetting('whatsapp_number', '5519983649875');
                window.open(`https://wa.me/${num}`, '_blank');
              }}
            >
              <MessageCircle className="mr-2 h-5 w-5" /> Chamar no WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
