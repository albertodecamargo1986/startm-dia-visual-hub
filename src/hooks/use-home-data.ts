import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Banner, Category, Product } from '@/types';

export const useBanners = () =>
  useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').eq('active', true).order('banner_order');
      return (data ?? []) as Banner[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('active', true).order('cat_order');
      return (data ?? []) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useFeaturedProducts = () =>
  useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('featured', true).eq('active', true).limit(12);
      return (data ?? []) as Product[];
    },
    staleTime: 5 * 60 * 1000,
  });
