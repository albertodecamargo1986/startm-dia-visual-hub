import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sticker, Search, SlidersHorizontal, MessageCircle, Eye, Star } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSettings } from '@/contexts/SettingsContext';
import { formatBRL } from '@/lib/format';
import type { Product, Category } from '@/types';

type ProductWithCategory = Product & { categories: { name: string; slug: string } | null };

const Shop = () => {
  const { categorySlug } = useParams();
  const { getSetting } = useSettings();
  const whatsappNumber = getSetting('whatsapp_number', '5519983649875');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('relevante');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('active', true).order('cat_order');
      return (data ?? []) as Category[];
    },
  });

  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['products-shop'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name, slug)').eq('active', true);
      return (data ?? []) as ProductWithCategory[];
    },
  });

  const categoryProductCounts = useMemo(() => {
    if (!allProducts) return {};
    const counts: Record<string, number> = {};
    allProducts.forEach(p => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  const maxPrice = useMemo(() => {
    if (!allProducts?.length) return 1000;
    return Math.max(...allProducts.map(p => Number(p.base_price) || 0), 100);
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    let result = [...allProducts];

    if (categorySlug) {
      const cat = categories?.find(c => c.slug === categorySlug);
      if (cat) result = result.filter(p => p.category_id === cat.id);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q));
    }

    if (featuredOnly) result = result.filter(p => p.featured);

    result = result.filter(p => {
      const price = Number(p.base_price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case 'menor_preco': result.sort((a, b) => (Number(a.base_price) || 0) - (Number(b.base_price) || 0)); break;
      case 'maior_preco': result.sort((a, b) => (Number(b.base_price) || 0) - (Number(a.base_price) || 0)); break;
      case 'mais_novo': result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()); break;
      default: result.sort((a, b) => (a.prod_order || 0) - (b.prod_order || 0));
    }

    return result;
  }, [allProducts, categorySlug, categories, debouncedSearch, featuredOnly, priceRange, sortBy]);

  const currentCategory = categories?.find(c => c.slug === categorySlug);
  const pageTitle = currentCategory ? `${currentCategory.name} | StartMídia Limeira/SP` : 'Produtos | StartMídia Comunicação Visual';
  const pageDesc = currentCategory?.description || 'Explore nosso catálogo completo de comunicação visual: banners, adesivos, placas, lonas e mais.';

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-3">Categorias</h3>
        <div className="space-y-1">
          <Link to="/produtos" className={`block px-3 py-2 rounded-md text-sm transition-colors ${!categorySlug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
            Todos ({allProducts?.length || 0})
          </Link>
          {categories?.map(c => (
            <Link key={c.id} to={`/produtos/${c.slug}`} className={`block px-3 py-2 rounded-md text-sm transition-colors ${categorySlug === c.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              {c.name} ({categoryProductCounts[c.id] || 0})
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Faixa de Preço</h3>
        <Slider min={0} max={maxPrice} step={1} value={priceRange} onValueChange={setPriceRange} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>R$ {priceRange[0]}</span>
          <span>R$ {priceRange[1]}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-foreground">Apenas destaque</label>
        <Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} />
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
      </Helmet>

      <div className="container py-8">
        <h1 className="font-display text-4xl mb-2">{currentCategory ? currentCategory.name : 'Nossos Produtos'}</h1>
        <p className="text-muted-foreground mb-6">{pageDesc}</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevante">Mais relevante</SelectItem>
              <SelectItem value="menor_preco">Menor preço</SelectItem>
              <SelectItem value="maior_preco">Maior preço</SelectItem>
              <SelectItem value="mais_novo">Mais novo</SelectItem>
            </SelectContent>
          </Select>
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros</Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
                <div className="mt-6"><FilterSidebar /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            ) : filteredProducts.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="group overflow-hidden hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 transition-all bg-card border-border">
                      <Link to={`/produto/${p.slug}`}>
                        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <Sticker className="h-12 w-12 text-muted-foreground" />
                          )}
                          {p.featured && (
                            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" /> Destaque</Badge>
                          )}
                          {p.categories && (
                            <Badge variant="secondary" className="absolute top-2 right-2 text-xs">{p.categories.name}</Badge>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-3">
                        <Link to={`/produto/${p.slug}`}>
                          <h3 className="font-semibold text-foreground text-sm mt-1 line-clamp-1">{p.name}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                        {Number(p.base_price) > 0 && (
                          <p className="mt-2 text-primary font-bold text-sm">
                            a partir de {formatBRL(Number(p.base_price))}
                            <span className="text-xs text-muted-foreground font-normal"> / {p.price_unit}</span>
                          </p>
                        )}
                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/produto/${p.slug}`} className="flex-1">
                            <Button size="sm" className="w-full text-xs"><Eye className="h-3 w-3 mr-1" /> Ver</Button>
                          </Link>
                          <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de um orçamento para: ${p.name}`)}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="text-xs"><MessageCircle className="h-3 w-3" /></Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Shop;
