import { supabase } from "@/integrations/supabase/client";

const CMS_FUNCTION = "cms-api";

async function callCms<T = unknown>(
  action: string,
  body: Record<string, unknown>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { data, error } = await supabase.functions.invoke(`${CMS_FUNCTION}/${action}`, {
    method: "POST",
    body,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as { success: boolean; data?: T; error?: string };
}

export interface CmsPageInput {
  id?: string;
  slug: string;
  title: string;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
  is_home?: boolean;
}

export interface CmsSectionInput {
  id?: string;
  type: string;
  name?: string;
  enabled?: boolean;
  data: Record<string, unknown>;
}

export async function publishPage(pageId: string) {
  return callCms<{ pageId: string; version: number; status: string }>(
    "publish-page",
    { pageId },
  );
}

export async function unpublishPage(pageId: string, status: "draft" | "archived" = "draft") {
  return callCms<{ pageId: string; status: string }>(
    "unpublish-page",
    { pageId, status },
  );
}

export async function savePageDraft(page: CmsPageInput, sections: CmsSectionInput[]) {
  return callCms<{ pageId: string }>(
    "save-page-draft",
    { page, sections },
  );
}

export async function duplicatePage(pageId: string, newSlug: string, newTitle: string) {
  return callCms<{ pageId: string; slug: string }>(
    "duplicate-page",
    { pageId, newSlug, newTitle },
  );
}
