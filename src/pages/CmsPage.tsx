import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import { Loader2 } from 'lucide-react';
import NotFound from './NotFound';

const CmsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ['cms-public-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', slug!)
        .eq('status', 'published')
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['cms-public-sections', page?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_sections')
        .select('*')
        .eq('page_id', page!.id)
        .eq('enabled', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!page?.id,
  });

  if (pageLoading || sectionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageError || !page) {
    return <NotFound />;
  }

  const seoTitle = page.seo_title || page.title;
  const seoDescription = page.seo_description || '';
  const canonical = `https://startmidialimeira.com.br/p/${page.slug}`;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={page.og_image_url || undefined}
        canonical={canonical}
      />
      <main>
        {sections?.map((section) => (
          <BlockRenderer
            key={section.id}
            type={section.type}
            data={section.data as Record<string, unknown>}
          />
        ))}
      </main>
    </>
  );
};

export default CmsPage;
