import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User, Upload, CreditCard, CheckCircle, Ruler, MessageCircle, X, FileText } from 'lucide-react';
import { formatBRL } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { label: 'Dados', icon: User },
  { label: 'Envio de Arte', icon: Upload },
  { label: 'Pagamento', icon: CreditCard },
  { label: 'Confirmação', icon: CheckCircle },
];

const ACCEPTED_TYPES = [
  'application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
  'application/postscript', 'application/illustrator',
  'application/x-cdr', 'application/cdr',
];
const ACCEPTED_EXT = '.pdf,.ai,.cdr,.png,.jpg,.jpeg';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { profile, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Step 1 state
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', cpfCnpj: '',
    zip: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '',
  });
  const [notes, setNotes] = useState('');
  const [fetchingCep, setFetchingCep] = useState(false);

  // Step 2 state
  const [artworkFiles, setArtworkFiles] = useState<Record<string, { file: File; progress: number; url?: string }>>({});
  const [requestArtItems, setRequestArtItems] = useState<Set<string>>(new Set());
  const [itemIdMap, setItemIdMap] = useState<Record<string, string>>({});

  const artworkItems = items.filter(i => i.needsArtwork);
  const needsArtworkStep = artworkItems.length > 0;

  useEffect(() => {
    if (!items.length) navigate('/carrinho');
  }, [items, navigate]);

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        fullName: profile.full_name || prev.fullName,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
        cpfCnpj: profile.cpf_cnpj || prev.cpfCnpj,
      }));
    }
  }, [profile]);

  const fetchCep = useCallback(async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch { /* ignore */ }
    setFetchingCep(false);
  }, []);

  const handleCreateOrder = async () => {
    if (!profile || !user) return;
    setLoading(true);

    try {
      const payload = {
        customer_id: profile.id,
        subtotal: total,
        total: total,
        shipping_address: {
          street: form.street, number: form.number, complement: form.complement,
          neighborhood: form.neighborhood, city: form.city, state: form.state, zip: form.zip,
        },
        notes,
        items: items.map(item => ({
          product_id: item.productId || null,
          product_name: item.productName,
          product_snapshot: {
            thumbnail: item.thumbnail,
            priceUnit: item.priceUnit,
            needsArtwork: item.needsArtwork,
            unitPrice: item.unitPrice,
          },
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity,
          custom_width: item.customWidth || null,
          custom_height: item.customHeight || null,
          notes: item.notes || '',
          artwork_status: item.needsArtwork ? 'pending' : 'not_required',
        })),
      };

      const { data, error } = await supabase.rpc('create_order_transactional', {
        payload: JSON.parse(JSON.stringify(payload)),
      });

      if (error) {
        console.error('Checkout RPC error:', error);
        toast.error('Erro ao criar pedido. Tente novamente.');
        setLoading(false);
        return;
      }

      const result = data as unknown as { order_id: string; order_number: string };
      setOrderId(result.order_id);
      setLoading(false);

      if (needsArtworkStep) {
        setStep(1);
      } else {
        setStep(2);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Erro inesperado ao criar pedido.');
      setLoading(false);
    }
  };

  const handleFileSelect = async (itemId: string, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 50MB.');
      return;
    }
    if (!orderId || !user || !profile) return;

    setArtworkFiles(prev => ({ ...prev, [itemId]: { file, progress: 0 } }));

    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${user.id}/${orderId}/${itemId}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from('artwork-files').upload(path, file, {
      upsert: true,
    });

    if (error) {
      toast.error(`Erro no upload: ${error.message}`);
      setArtworkFiles(prev => { const n = { ...prev }; delete n[itemId]; return n; });
      return;
    }

    // Gerar URL assinada de 1 ano
    const { data: signedData } = await supabase.storage
      .from('artwork-files')
      .createSignedUrl(path, 31536000);

    const fileUrl = signedData?.signedUrl || path;

    setArtworkFiles(prev => ({ ...prev, [itemId]: { file, progress: 100, url: fileUrl } }));

    // Buscar o order_item correspondente
    const { data: orderItemsData } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderId)
      .eq('product_name', items.find(i => i.id === itemId)?.productName || '');

    const orderItemId = orderItemsData?.[0]?.id || null;

    await supabase.from('customer_files').insert({
      customer_id: profile.id,
      order_item_id: orderItemId,
      file_name: file.name,
      file_url: fileUrl,
      file_type: file.type,
      file_size: file.size,
      category: 'artwork',
      status: 'pending',
    });

    // Atualizar artwork_url no order_item
    if (orderItemId) {
      await supabase.from('order_items').update({
        artwork_url: fileUrl,
        artwork_status: 'pending',
      }).eq('id', orderItemId);
    }

    toast.success(`Arquivo "${file.name}" enviado com sucesso!`);
  };

  const handlePayment = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pagseguro-payment', {
        body: { orderId },
      });

      if (error || !data?.redirectUrl) {
        toast.error('Erro ao iniciar pagamento. Seu pedido foi salvo.');
        clearCart();
        navigate(`/checkout/sucesso?order=${orderId}`);
        return;
      }

      clearCart();
      window.location.href = data.redirectUrl;
    } catch {
      toast.error('Erro ao conectar com o pagamento.');
      clearCart();
      navigate(`/checkout/sucesso?order=${orderId}`);
    }
    setLoading(false);
  };

  const whatsappNumber = settings.whatsapp_number || '5519983649875';

  if (!items.length) return null;

  return (
    <div className="container py-8">
      {/* Stepper */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          const show = needsArtworkStep || i !== 1;
          if (!show) return null;
          return (
            <div key={i} className="flex items-center">
              {i > 0 && (i !== 1 || needsArtworkStep) && (
                <div className={`h-0.5 w-8 md:w-16 ${isDone ? 'bg-primary' : 'bg-border'}`} />
              )}
              <div className={`flex flex-col items-center gap-1`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/80 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium hidden md:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* STEP 1 — Dados */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={e => { e.preventDefault(); handleCreateOrder(); }} className="space-y-6">
                  <Card className="p-6 bg-card border-border">
                    <h2 className="font-display text-2xl mb-4">Dados Pessoais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Nome completo" required value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className="md:col-span-2" />
                      <Input placeholder="E-mail" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                      <Input placeholder="Telefone" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                      <Input placeholder="CPF/CNPJ" required value={form.cpfCnpj} onChange={e => setForm(p => ({ ...p, cpfCnpj: e.target.value }))} className="md:col-span-2" />
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border-border">
                    <h2 className="font-display text-2xl mb-4">Endereço de Entrega</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Input placeholder="CEP" required value={form.zip}
                          onChange={e => setForm(p => ({ ...p, zip: e.target.value }))}
                          onBlur={e => fetchCep(e.target.value)}
                        />
                        {fetchingCep && <span className="absolute right-3 top-3 text-xs text-muted-foreground animate-pulse">Buscando...</span>}
                      </div>
                      <div /> {/* spacer */}
                      <Input placeholder="Rua" required value={form.street} onChange={e => setForm(p => ({ ...p, street: e.target.value }))} className="md:col-span-2" />
                      <Input placeholder="Número" required value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} />
                      <Input placeholder="Complemento" value={form.complement} onChange={e => setForm(p => ({ ...p, complement: e.target.value }))} />
                      <Input placeholder="Bairro" required value={form.neighborhood} onChange={e => setForm(p => ({ ...p, neighborhood: e.target.value }))} />
                      <Input placeholder="Cidade" required value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                      <Input placeholder="Estado" required value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border-border">
                    <h2 className="font-display text-2xl mb-4">Observações</h2>
                    <Textarea placeholder="Alguma observação sobre o pedido?" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                  </Card>

                  <Button type="submit" disabled={loading} className="w-full font-display text-lg tracking-wider">
                    {loading ? 'Processando...' : 'Continuar'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 2 — Envio de Arte */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <Card className="p-6 bg-card border-border">
                  <h2 className="font-display text-2xl mb-2">Envio de Arte</h2>
                  <p className="text-muted-foreground mb-6">Envie os arquivos de arte para os itens abaixo. Formatos aceitos: PDF, AI, CDR, PNG, JPG (máx 50MB).</p>

                  <div className="space-y-6">
                    {artworkItems.map(item => {
                      const fileState = artworkFiles[item.id];
                      const requested = requestArtItems.has(item.id);
                      return (
                        <div key={item.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {item.thumbnail && <img src={item.thumbnail} alt="" className="w-12 h-12 rounded object-cover" />}
                            <div>
                              <p className="font-semibold">{item.productName}</p>
                              {item.customWidth && item.customHeight && (
                                <p className="text-sm text-muted-foreground">{item.customWidth}cm × {item.customHeight}cm</p>
                              )}
                            </div>
                          </div>

                          {!fileState && !requested ? (
                            <div className="space-y-3">
                              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">Arraste ou clique para enviar</span>
                                <input type="file" className="hidden" accept={ACCEPTED_EXT}
                                  onChange={e => { if (e.target.files?.[0]) handleFileSelect(item.id, e.target.files[0]); }}
                                />
                              </label>
                              <div className="flex gap-2 flex-wrap">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm"><Ruler className="w-4 h-4 mr-1" /> Guia de Medidas</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Guia de Medidas</DialogTitle></DialogHeader>
                                    <div className="space-y-3 text-sm text-muted-foreground">
                                      <p>• Resolução mínima: 150 DPI (ideal 300 DPI)</p>
                                      <p>• Formatos aceitos: PDF, AI, CDR, PNG, JPG</p>
                                      <p>• Modo de cor: CMYK para impressão</p>
                                      <p>• Sangria: 1cm em cada lado</p>
                                      <p>• Textos convertidos em curvas</p>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setRequestArtItems(prev => new Set(prev).add(item.id));
                                  const msg = `Olá! Gostaria de solicitar a criação de arte para: ${item.productName}`;
                                  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}>
                                  <MessageCircle className="w-4 h-4 mr-1" /> Solicitar Arte
                                </Button>
                              </div>
                            </div>
                          ) : requested ? (
                            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                              <MessageCircle className="w-4 h-4 inline mr-1" /> Arte solicitada via WhatsApp. Você pode enviar o arquivo depois na área do cliente.
                            </div>
                          ) : fileState ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-primary" />
                                <span className="text-sm flex-1 truncate">{fileState.file.name}</span>
                                {fileState.progress === 100 && <CheckCircle className="w-5 h-5 text-green-500" />}
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                  setArtworkFiles(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                                }}><X className="w-4 h-4" /></Button>
                              </div>
                              {fileState.progress < 100 && <Progress value={fileState.progress} className="h-2" />}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Button onClick={() => setStep(2)} className="w-full font-display text-lg tracking-wider">
                  Continuar para Pagamento
                </Button>
              </motion.div>
            )}

            {/* STEP 3 — Pagamento */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <Card className="p-6 bg-card border-border">
                  <h2 className="font-display text-2xl mb-4">Pagamento</h2>
                  <p className="text-muted-foreground mb-6">
                    Você será redirecionado para o PagSeguro para concluir o pagamento de forma segura.
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-6">
                    {items.map(i => (
                      <div key={i.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{i.productName} ×{i.quantity}</span>
                        <span>{formatBRL(i.unitPrice * i.quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                       <span className="text-primary">{formatBRL(total)}</span>
                    </div>
                  </div>

                  <Button onClick={handlePayment} disabled={loading} className="w-full font-display text-lg tracking-wider" size="lg">
                    {loading ? 'Redirecionando...' : 'Pagar com PagSeguro'}
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar — Resumo */}
        <Card className="p-6 h-fit bg-card border-border sticky top-24">
          <h2 className="font-display text-2xl mb-4">Resumo do Pedido</h2>
          <div className="space-y-3">
            {items.map(i => (
              <div key={i.id} className="flex gap-3">
                {i.thumbnail && <img src={i.thumbnail} alt="" className="w-12 h-12 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{i.productName}</p>
                  <p className="text-xs text-muted-foreground">Qtd: {i.quantity}</p>
                  {i.customWidth && i.customHeight && (
                    <p className="text-xs text-muted-foreground">{i.customWidth}cm × {i.customHeight}cm</p>
                  )}
                </div>
                <span className="text-sm font-medium">{formatBRL(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
