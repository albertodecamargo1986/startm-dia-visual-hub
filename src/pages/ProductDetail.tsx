import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, MessageCircle, Clock, Ruler, Sticker } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import type { Product } from '@/types';

const ProductDetail = () => {
  const { productSlug } = useParams();
  const { addItem } = useCart();
  const { getSetting } = useSettings();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productSlug],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name, slug)').eq('slug', productSlug!).single();
      return data as Product & { categories: { name: string; slug: string } | null };
    },
    enabled: !!productSlug,
  });

  if (isLoading) return <div className="container py-12 text-center text-muted-foreground">Carregando...</div>;
  if (!product) return <div className="container py-12 text-center text-muted-foreground">Produto não encontrado.</div>;

  const images = (product.images?.length ? product.images : [product.thumbnail]).filter(Boolean);
  const whatsappNumber = getSetting('whatsapp_number', '5519983649875');
  const whatsappMsg = encodeURIComponent(`Olá! Gostaria de um orçamento para o produto: ${product.name}`);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      thumbnail: product.thumbnail ?? '',
      unitPrice: Number(product.base_price),
      quantity,
      priceUnit: product.price_unit ?? 'unidade',
      needsArtwork: product.needs_artwork ?? false,
      ...(customWidth && { customWidth: parseFloat(customWidth) }),
      ...(customHeight && { customHeight: parseFloat(customHeight) }),
    });
    toast.success('Produto adicionado ao carrinho!');
  };

  return (
    <div className="container py-8">
      <div className="text-sm text-muted-foreground mb-4">
        <Link to="/produtos" className="hover:text-foreground">Produtos</Link>
        {product.categories && <> / <Link to={`/produtos/${product.categories.slug}`} className="hover:text-foreground">{product.categories.name}</Link></>}
        <span> / {product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Sticker className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${i === selectedImage ? 'border-primary' : 'border-border'}`}>
                  <img src={img!} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl mb-2">{product.name}</h1>
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">{product.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
          )}
          <p className="text-muted-foreground mb-6">{product.description || product.short_description}</p>

          {Number(product.base_price) > 0 && (
            <p className="text-3xl font-bold text-primary mb-2">
              R$ {Number(product.base_price).toFixed(2).replace('.', ',')} <span className="text-base text-muted-foreground font-normal">/ {product.price_unit}</span>
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Prazo: {product.production_days} dias úteis</span>
            {product.has_custom_size && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> Tamanho personalizado</span>}
          </div>

          {product.has_custom_size && (
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">Largura (cm)</label>
                <Input type="number" value={customWidth} onChange={e => setCustomWidth(e.target.value)} placeholder="Ex: 100" />
              </div>
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">Altura (cm)</label>
                <Input type="number" value={customHeight} onChange={e => setCustomHeight(e.target.value)} placeholder="Ex: 200" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-muted-foreground">Quantidade:</label>
            <Input type="number" min={product.min_quantity ?? 1} value={quantity} onChange={e => setQuantity(Math.max(product.min_quantity ?? 1, parseInt(e.target.value) || 1))} className="w-24" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {Number(product.base_price) > 0 && (
              <Button onClick={handleAddToCart} size="lg" className="font-display text-lg tracking-wider">
                <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar ao Carrinho
              </Button>
            )}
            <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="w-full font-display text-lg tracking-wider">
                <MessageCircle className="mr-2 h-5 w-5" /> Solicitar Orçamento
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
