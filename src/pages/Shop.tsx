import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sticker } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product, Category } from '@/types';

const Shop = () => {
  const { categorySlug } = useParams();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('active', true).order('cat_order');
      return (data ?? []) as Category[];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      let query = supabase.from('products').select('*, categories(name, slug)').eq('active', true).order('prod_order');
      if (categorySlug) {
        const cat = categories?.find(c => c.slug === categorySlug);
        if (cat) query = query.eq('category_id', cat.id);
      }
      const { data } = await query;
      return (data ?? []) as (Product & { categories: { name: string; slug: string } | null })[];
    },
    enabled: !categorySlug || !!categories,
  });

  const currentCategory = categories?.find(c => c.slug === categorySlug);

  return (
    <div className="container py-8">
      <h1 className="font-display text-4xl mb-2">{currentCategory ? currentCategory.name : 'Nossos Produtos'}</h1>
      <p className="text-muted-foreground mb-8">
        {currentCategory ? currentCategory.description || `Produtos da categoria ${currentCategory.name}` : 'Explore nosso catálogo completo de comunicação visual'}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link to="/produtos">
          <Badge variant={!categorySlug ? 'default' : 'outline'} className="cursor-pointer">Todos</Badge>
        </Link>
        {categories?.map(c => (
          <Link key={c.id} to={`/produtos/${c.slug}`}>
            <Badge variant={categorySlug === c.slug ? 'default' : 'outline'} className="cursor-pointer">{c.name}</Badge>
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border-border">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/produto/${p.slug}`}>
                <Card className="group overflow-hidden hover:border-primary/50 transition-colors bg-card border-border">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Sticker className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    {p.categories && <span className="text-xs text-primary">{p.categories.name}</span>}
                    <h3 className="font-semibold text-foreground text-sm mt-1">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                    {Number(p.base_price) > 0 && (
                      <p className="mt-2 text-primary font-bold">R$ {Number(p.base_price).toFixed(2).replace('.', ',')} <span className="text-xs text-muted-foreground font-normal">/ {p.price_unit}</span></p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado.</p>
      )}
    </div>
  );
};

export default Shop;
