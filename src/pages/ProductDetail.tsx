import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, MessageCircle, Clock, Ruler, Sticker, FileText, Image, Info } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuiaMedidas } from '@/components/GuiaMedidas';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import { formatBRL } from '@/lib/format';
import type { Product } from '@/types';

type ProductWithCat = Product & { categories: { name: string; slug: string } | null };

const ProductDetail = () => {
  const { productSlug } = useParams();
  const { addItem } = useCart();
  const { getSetting } = useSettings();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [notes, setNotes] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productSlug],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name, slug)').eq('slug', productSlug!).single();
      return data as ProductWithCat;
    },
    enabled: !!productSlug,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name, slug)')
        .eq('active', true).eq('category_id', product!.category_id!).neq('id', product!.id).limit(8);
      return (data ?? []) as ProductWithCat[];
    },
    enabled: !!product?.category_id,
  });

  const images = useMemo(() => {
    if (!product) return [];
    return (product.images?.length ? product.images : [product.thumbnail]).filter(Boolean) as string[];
  }, [product]);

  if (isLoading) return <div className="container py-12 text-center text-muted-foreground">Carregando...</div>;
  if (!product) return <div className="container py-12 text-center text-muted-foreground">Produto não encontrado.</div>;

  const whatsappNumber = getSetting('whatsapp_number', '5519983649875');
  const whatsappMsg = encodeURIComponent(`Olá! Gostaria de um orçamento para o produto: ${product.name}`);
  const basePrice = Number(product.base_price) || 0;

  const area = customWidth && customHeight ? (parseFloat(customWidth) * parseFloat(customHeight)) / 10000 : 0;
  const calculatedPrice = product.has_custom_size && area > 0
    ? area * basePrice * quantity
    : basePrice * quantity;

  const handleAddToCart = () => {
    const unitPrice = product.has_custom_size && area > 0 ? area * basePrice : basePrice;
    addItem({
      productId: product.id,
      productName: product.name,
      thumbnail: product.thumbnail ?? '',
      unitPrice,
      quantity,
      priceUnit: product.price_unit ?? 'unidade',
      needsArtwork: product.needs_artwork ?? false,
      ...(customWidth && { customWidth: parseFloat(customWidth) }),
      ...(customHeight && { customHeight: parseFloat(customHeight) }),
      ...(notes && { notes }),
    });
    toast.success('Produto adicionado ao carrinho!');
  };

  return (
    <>
      <Helmet>
        <title>{product.meta_title || product.name} | StartMídia Limeira/SP</title>
        <meta name="description" content={product.meta_description || product.short_description || ''} />
        <link rel="canonical" href={`https://startmidialimeira.com.br/produto/${productSlug}`} />
      </Helmet>

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/produtos" className="hover:text-foreground">Produtos</Link>
          {product.categories && (
            <>
              <span>/</span>
              <Link to={`/produtos/${product.categories.slug}`} className="hover:text-foreground">{product.categories.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center cursor-zoom-in">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-150 origin-center" />
              ) : (
                <Sticker className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors ${i === selectedImage ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="font-display text-3xl md:text-4xl mb-2">{product.name}</h1>

            <div className="flex flex-wrap gap-1 mb-4">
              {product.tags?.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
              {product.needs_artwork && <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" /> Precisa de arte</Badge>}
            </div>

            <p className="text-muted-foreground mb-6">{product.description || product.short_description}</p>

            {basePrice > 0 && (
              <p className="text-3xl font-bold text-primary mb-2">
                a partir de {formatBRL(basePrice)}
                <span className="text-base text-muted-foreground font-normal"> / {product.price_unit}</span>
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Produção: {product.production_days} dias úteis</span>
              {product.has_custom_size && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> Tamanho personalizado</span>}
            </div>

            {/* Size configurator */}
            {product.has_custom_size && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-sm">Configurar Tamanho</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Largura (cm)</label>
                    <Input type="number" value={customWidth} onChange={e => setCustomWidth(e.target.value)} placeholder="Ex: 100" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Altura (cm)</label>
                    <Input type="number" value={customHeight} onChange={e => setCustomHeight(e.target.value)} placeholder="Ex: 200" />
                  </div>
                </div>
                {area > 0 && (
                  <p className="text-sm font-medium">
                    Área: {area.toFixed(2)} m² — Subtotal: <span className="text-primary font-bold">{formatBRL(calculatedPrice)}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm text-muted-foreground">Quantidade:</label>
              <Input type="number" min={product.min_quantity ?? 1} value={quantity}
                onChange={e => setQuantity(Math.max(product.min_quantity ?? 1, parseInt(e.target.value) || 1))} className="w-24" />
            </div>

            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-1 block">Observações</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações adicionais sobre o pedido..." rows={3} />
            </div>

            {calculatedPrice > 0 && (
              <p className="text-lg font-bold text-foreground mb-4">
                Total: <span className="text-primary">{formatBRL(calculatedPrice)}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {basePrice > 0 && (
                <Button onClick={handleAddToCart} size="lg" className="font-display text-lg tracking-wider">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar ao Carrinho
                </Button>
              )}
              <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full font-display text-lg tracking-wider">
                  <MessageCircle className="mr-2 h-5 w-5" /> Solicitar Orçamento
                </Button>
              </a>
            </div>

            {/* Measurement Guide */}
            <GuiaMedidas
              productName={product.name}
              productUnit={product.price_unit ?? 'un'}
              trigger={
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Ruler className="mr-2 h-4 w-4" /> 📐 Guia de Medidas
                </Button>
              }
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="descricao" className="mt-12">
          <TabsList>
            <TabsTrigger value="descricao"><FileText className="h-4 w-4 mr-1" /> Descrição</TabsTrigger>
            <TabsTrigger value="especificacoes"><Info className="h-4 w-4 mr-1" /> Especificações</TabsTrigger>
            <TabsTrigger value="arte"><Image className="h-4 w-4 mr-1" /> Como enviar arte</TabsTrigger>
          </TabsList>
          <TabsContent value="descricao" className="mt-4 prose prose-sm max-w-none text-muted-foreground">
            <p>{product.description || product.short_description || 'Descrição não disponível.'}</p>
          </TabsContent>
          <TabsContent value="especificacoes" className="mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 p-3 rounded-md"><span className="text-muted-foreground">Prazo:</span> <strong>{product.production_days} dias úteis</strong></div>
              <div className="bg-muted/50 p-3 rounded-md"><span className="text-muted-foreground">Qtd mínima:</span> <strong>{product.min_quantity}</strong></div>
              <div className="bg-muted/50 p-3 rounded-md"><span className="text-muted-foreground">Unidade:</span> <strong>{product.price_unit}</strong></div>
              <div className="bg-muted/50 p-3 rounded-md"><span className="text-muted-foreground">Peso aprox.:</span> <strong>{product.weight_g}g</strong></div>
              {product.has_custom_size && <div className="bg-muted/50 p-3 rounded-md col-span-2"><span className="text-muted-foreground">Tamanho:</span> <strong>Personalizado</strong></div>}
            </div>
          </TabsContent>
          <TabsContent value="arte" className="mt-4 text-sm text-muted-foreground space-y-3">
            <p><strong>Formatos aceitos:</strong> PDF, AI, CDR, PSD, PNG (300dpi), JPG (alta resolução)</p>
            <p><strong>Resolução mínima:</strong> 150 DPI (ideal 300 DPI)</p>
            <p><strong>Modo de cor:</strong> CMYK para melhor fidelidade de cor</p>
            <p><strong>Sangria:</strong> Adicione 3mm de sangria em todos os lados</p>
            <p><strong>Fontes:</strong> Converta todas as fontes em curvas</p>
            <p>Envie sua arte após finalizar o pedido na área do cliente, ou entre em contato pelo WhatsApp para suporte.</p>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl mb-6">Produtos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/produto/${p.slug}`}>
                    <Card className="group overflow-hidden hover:border-primary/50 transition-colors bg-card border-border">
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Sticker className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-foreground text-sm line-clamp-1">{p.name}</h3>
                        {Number(p.base_price) > 0 && (
                          <p className="mt-1 text-primary font-bold text-sm">{formatBRL(Number(p.base_price))}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ProductDetail;
