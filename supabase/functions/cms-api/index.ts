import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}

function requestId() {
  return crypto.randomUUID().slice(0, 8);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rid = requestId();
  const url = new URL(req.url);
  // Action from path: /cms-api/publish-page → "publish-page"
  const segments = url.pathname.split("/").filter(Boolean);
  const action = segments[segments.length - 1] === "cms-api"
    ? null
    : segments[segments.length - 1];

  console.log(`[${rid}] CMS API action=${action}`);

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err("Missing authorization", 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // User client for auth check
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return err("Unauthorized", 401);

  // Admin check
  const adminClient = createClient(supabaseUrl, supabaseKey);
  const { data: isAdmin } = await adminClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  const { data: isSuperAdmin } = await adminClient.rpc("has_role", {
    _user_id: user.id,
    _role: "super_admin",
  });
  if (!isAdmin && !isSuperAdmin) return err("Forbidden", 403);

  try {
    const body = req.method === "POST" ? await req.json() : {};

    switch (action) {
      case "publish-page":
        return await publishPage(adminClient, body, user.id, rid);
      case "unpublish-page":
        return await unpublishPage(adminClient, body, user.id, rid);
      case "save-page-draft":
        return await savePageDraft(adminClient, body, user.id, rid);
      case "duplicate-page":
        return await duplicatePage(adminClient, body, user.id, rid);
      default:
        return err(`Unknown action: ${action}`, 404);
    }
  } catch (e) {
    console.error(`[${rid}] Error:`, e);
    return err("Internal server error", 500);
  }
});

// ─── PUBLISH PAGE ───────────────────────────────────────────
async function publishPage(
  db: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
  userId: string,
  rid: string,
) {
  const pageId = body.pageId as string;
  if (!pageId || typeof pageId !== "string") return err("pageId is required");

  console.log(`[${rid}] Publishing page ${pageId}`);

  // Fetch page + sections for snapshot
  const { data: page, error: pErr } = await db
    .from("cms_pages")
    .select("*")
    .eq("id", pageId)
    .single();
  if (pErr || !page) return err("Page not found", 404);

  const { data: sections } = await db
    .from("cms_sections")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order");

  // Get next version
  const { data: lastRev } = await db
    .from("cms_page_revisions")
    .select("version")
    .eq("page_id", pageId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (lastRev?.[0]?.version ?? 0) + 1;

  // Create revision
  const { error: revErr } = await db.from("cms_page_revisions").insert({
    page_id: pageId,
    version: nextVersion,
    snapshot: { page, sections: sections ?? [] },
    created_by: userId,
  });
  if (revErr) {
    console.error(`[${rid}] Revision error:`, revErr);
    return err("Failed to create revision");
  }

  // Update page status
  const { error: upErr } = await db
    .from("cms_pages")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", pageId);
  if (upErr) return err("Failed to publish page");

  return json({
    success: true,
    data: { pageId, version: nextVersion, status: "published" },
  });
}

// ─── UNPUBLISH PAGE ─────────────────────────────────────────
async function unpublishPage(
  db: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
  userId: string,
  rid: string,
) {
  const pageId = body.pageId as string;
  const targetStatus = (body.status as string) || "draft";
  if (!pageId) return err("pageId is required");
  if (!["draft", "archived"].includes(targetStatus)) {
    return err("status must be draft or archived");
  }

  console.log(`[${rid}] Unpublishing page ${pageId} → ${targetStatus}`);

  const { error } = await db
    .from("cms_pages")
    .update({ status: targetStatus, updated_by: userId })
    .eq("id", pageId);
  if (error) return err("Failed to unpublish page");

  return json({ success: true, data: { pageId, status: targetStatus } });
}

// ─── SAVE PAGE DRAFT ────────────────────────────────────────
async function savePageDraft(
  db: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
  userId: string,
  rid: string,
) {
  const page = body.page as Record<string, unknown> | undefined;
  const sections = body.sections as Record<string, unknown>[] | undefined;

  if (!page) return err("page object is required");
  if (!page.title || !page.slug) return err("page.title and page.slug are required");

  console.log(`[${rid}] Saving draft for slug=${page.slug}`);

  // Upsert page
  const pagePayload = {
    slug: page.slug as string,
    title: page.title as string,
    seo_title: (page.seo_title as string) || null,
    seo_description: (page.seo_description as string) || null,
    og_image_url: (page.og_image_url as string) || null,
    is_home: (page.is_home as boolean) || false,
    updated_by: userId,
  };

  let pageId = page.id as string | undefined;

  if (pageId) {
    // Update existing
    const { error } = await db
      .from("cms_pages")
      .update(pagePayload)
      .eq("id", pageId);
    if (error) {
      console.error(`[${rid}] Page update error:`, error);
      return err("Failed to update page");
    }
  } else {
    // Insert new
    const { data: newPage, error } = await db
      .from("cms_pages")
      .insert({ ...pagePayload, created_by: userId, status: "draft" })
      .select("id")
      .single();
    if (error || !newPage) {
      console.error(`[${rid}] Page insert error:`, error);
      return err(error?.message ?? "Failed to create page");
    }
    pageId = newPage.id;
  }

  // Upsert sections
  if (sections && Array.isArray(sections)) {
    // Get existing section IDs
    const { data: existing } = await db
      .from("cms_sections")
      .select("id")
      .eq("page_id", pageId);
    const existingIds = new Set((existing ?? []).map((s: { id: string }) => s.id));

    const incomingIds = new Set<string>();

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const sectionPayload = {
        page_id: pageId!,
        type: sec.type as string,
        name: (sec.name as string) || null,
        sort_order: i,
        enabled: sec.enabled !== false,
        data: (sec.data as Record<string, unknown>) || {},
      };

      if (sec.id && typeof sec.id === "string") {
        incomingIds.add(sec.id);
        await db
          .from("cms_sections")
          .update(sectionPayload)
          .eq("id", sec.id);
      } else {
        const { data: newSec } = await db
          .from("cms_sections")
          .insert(sectionPayload)
          .select("id")
          .single();
        if (newSec) incomingIds.add(newSec.id);
      }
    }

    // Delete removed sections
    for (const eid of existingIds) {
      if (!incomingIds.has(eid)) {
        await db.from("cms_sections").delete().eq("id", eid);
      }
    }
  }

  return json({ success: true, data: { pageId } });
}

// ─── DUPLICATE PAGE ─────────────────────────────────────────
async function duplicatePage(
  db: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
  userId: string,
  rid: string,
) {
  const pageId = body.pageId as string;
  const newSlug = body.newSlug as string;
  const newTitle = body.newTitle as string;

  if (!pageId) return err("pageId is required");
  if (!newSlug) return err("newSlug is required");
  if (!newTitle) return err("newTitle is required");

  console.log(`[${rid}] Duplicating page ${pageId} → ${newSlug}`);

  // Get source page
  const { data: source, error: srcErr } = await db
    .from("cms_pages")
    .select("*")
    .eq("id", pageId)
    .single();
  if (srcErr || !source) return err("Source page not found", 404);

  // Create new page
  const { data: newPage, error: cpErr } = await db
    .from("cms_pages")
    .insert({
      slug: newSlug,
      title: newTitle,
      seo_title: source.seo_title,
      seo_description: source.seo_description,
      og_image_url: source.og_image_url,
      is_home: false,
      status: "draft",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (cpErr || !newPage) {
    return err(cpErr?.message ?? "Failed to duplicate page");
  }

  // Copy sections
  const { data: srcSections } = await db
    .from("cms_sections")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order");

  if (srcSections?.length) {
    const newSections = srcSections.map((s: Record<string, unknown>) => ({
      page_id: newPage.id,
      type: s.type,
      name: s.name,
      sort_order: s.sort_order,
      enabled: s.enabled,
      data: s.data,
    }));
    await db.from("cms_sections").insert(newSections);
  }

  return json({
    success: true,
    data: { pageId: newPage.id, slug: newSlug },
  });
}
