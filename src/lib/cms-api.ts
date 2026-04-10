import { supabase } from '@/integrations/supabase/client';

const FUNCTION_NAME = 'cms-api';

interface CmsResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function callCms<T = unknown>(action: string, body: Record<string, unknown>): Promise<CmsResponse<T>> {
  const { data, error } = await supabase.functions.invoke(`${FUNCTION_NAME}/${action}`, {
    body,
  });
  if (error) return { success: false, error: error.message };
  return data as CmsResponse<T>;
}

export const cmsApi = {
  saveDraft: (page: Record<string, unknown>, sections: Record<string, unknown>[]) =>
    callCms('save-page-draft', { page, sections }),

  publish: (pageId: string) =>
    callCms('publish-page', { pageId }),

  unpublish: (pageId: string) =>
    callCms('unpublish-page', { pageId }),

  duplicate: (pageId: string, newSlug: string, newTitle: string) =>
    callCms('duplicate-page', { pageId, newSlug, newTitle }),
};
