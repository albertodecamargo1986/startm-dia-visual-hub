import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function rid() {
  return crypto.randomUUID().slice(0, 8);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const requestId = rid();
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const action = segments[segments.length - 1];

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client to get identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ success: false, error: "Unauthorized" }, 401);

    // Admin client for operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Check roles
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const userRoles = (roles || []).map((r: { role: string }) => r.role);
    const isAdmin = userRoles.includes("admin") || userRoles.includes("super_admin");
    const isSuperAdmin = userRoles.includes("super_admin");

    if (!isAdmin) return json({ success: false, error: "Forbidden" }, 403);

    const body = await req.json();

    switch (action) {
      case "save-page-draft":
        return await savePageDraft(admin, body, user.id, requestId);
      case "publish-page":
        if (!isSuperAdmin) return json({ success: false, error: "Apenas super_admin pode publicar" }, 403);
        return await publishPage(admin, body, user.id, requestId);
      case "unpublish-page":
        if (!isSuperAdmin) return json({ success: false, error: "Apenas super_admin pode despublicar" }, 403);
        return await unpublishPage(admin, body, user.id, requestId);
      case "duplicate-page":
        return await duplicatePage(admin, body, user.id, requestId);
      case "soft-delete-page":
        return await softDeletePage(admin, body, user.id, requestId);
      case "restore-page":
        if (!isSuperAdmin) return json({ success: false, error: "Apenas super_admin pode restaurar" }, 403);
        return await restorePage(admin, body, user.id, requestId);
      case "restore-revision":
        if (!isSuperAdmin) return json({ success: false, error: "Apenas super_admin pode restaurar revisões" }, 403);
        return await restoreRevision(admin, body, user.id, requestId);
      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 404);
    }
  } catch (err) {
    console.error(`[${requestId}] Error:`, err);
    return json({ success: false, error: "Internal error" }, 500);
  }
});

// ── Audit helper ──
async function audit(
  admin: ReturnType<typeof createClient>,
  action: string,
  userId: string,
  entityType: string,
  entityId: string,
  beforeData: unknown = null,
  afterData: unknown = null,
  metadata: Record<string, unknown> = {}
) {
  await admin.from("cms_audit_log").insert({
    action,
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData,
    after_data: afterData,
    metadata,
  });
}

// ── Save Draft ──
async function savePageDraft(
  admin: ReturnType<typeof createClient>,
  body: { page: Record<string, unknown>; sections: Record<string, unknown>[] },
  userId: string,
  rid: string
) {
  const { page, sections } = body;
  if (!page || !sections) return json({ success: false, error: "page and sections required" }, 400);

  const pageId = page.id as string;

  // Get before state for audit
  let beforePage = null;
  if (pageId) {
    const { data } = await admin.from("cms_pages").select("*").eq("id", pageId).single();
    beforePage = data;
  }

  // Upsert page
  const pagePayload: Record<string, unknown> = {
    title: page.title,
    slug: page.slug,
    seo_title: page.seo_title || null,
    seo_description: page.seo_description || null,
    is_home: page.is_home || false,
    updated_by: userId,
  };

  let finalPageId = pageId;
  if (pageId) {
    await admin.from("cms_pages").update(pagePayload).eq("id", pageId);
  } else {
    pagePayload.status = "draft";
    pagePayload.created_by = userId;
    const { data, error } = await admin.from("cms_pages").insert(pagePayload).select("id").single();
    if (error) return json({ success: false, error: error.message }, 400);
    finalPageId = data.id;
  }

  // Get existing section IDs
  const { data: existingSections } = await admin
    .from("cms_sections")
    .select("id")
    .eq("page_id", finalPageId);
  const existingIds = new Set((existingSections || []).map((s: { id: string }) => s.id));
  const incomingIds = new Set(sections.filter((s) => s.id).map((s) => s.id as string));

  // Delete removed sections
  for (const eid of existingIds) {
    if (!incomingIds.has(eid)) {
      await admin.from("cms_sections").delete().eq("id", eid);
    }
  }

  // Upsert sections
  for (const s of sections) {
    const sPayload = {
      page_id: finalPageId,
      type: s.type,
      name: s.name || null,
      sort_order: s.sort_order,
      enabled: s.enabled ?? true,
      data: s.data || {},
    };

    if (s.id && existingIds.has(s.id as string)) {
      await admin.from("cms_sections").update(sPayload).eq("id", s.id);
    } else {
      await admin.from("cms_sections").insert(sPayload);
    }
  }

  // Audit
  const { data: afterPage } = await admin.from("cms_pages").select("*").eq("id", finalPageId).single();
  await audit(admin, "save_draft", userId, "cms_page", finalPageId!, beforePage, afterPage);

  return json({ success: true, data: { pageId: finalPageId } });
}

// ── Publish ──
async function publishPage(
  admin: ReturnType<typeof createClient>,
  body: { pageId: string },
  userId: string,
  rid: string
) {
  const { pageId } = body;
  if (!pageId) return json({ success: false, error: "pageId required" }, 400);

  const { data: page } = await admin.from("cms_pages").select("*").eq("id", pageId).single();
  if (!page) return json({ success: false, error: "Page not found" }, 404);

  // Get sections for snapshot
  const { data: sections } = await admin
    .from("cms_sections")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order");

  // Create revision
  const { data: lastRev } = await admin
    .from("cms_page_revisions")
    .select("version")
    .eq("page_id", pageId)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = (lastRev?.[0]?.version || 0) + 1;

  await admin.from("cms_page_revisions").insert({
    page_id: pageId,
    version: nextVersion,
    snapshot: { page, sections },
    created_by: userId,
  });

  // Update status
  const beforeStatus = page.status;
  await admin.from("cms_pages").update({
    status: "published",
    published_at: new Date().toISOString(),
    updated_by: userId,
  }).eq("id", pageId);

  await audit(admin, "publish", userId, "cms_page", pageId, { status: beforeStatus }, { status: "published", version: nextVersion });

  return json({ success: true, data: { version: nextVersion } });
}

// ── Unpublish ──
async function unpublishPage(
  admin: ReturnType<typeof createClient>,
  body: { pageId: string; targetStatus?: string },
  userId: string,
  rid: string
) {
  const { pageId, targetStatus = "draft" } = body;
  if (!pageId) return json({ success: false, error: "pageId required" }, 400);
  if (!["draft", "archived"].includes(targetStatus)) return json({ success: false, error: "Invalid target status" }, 400);

  const { data: page } = await admin.from("cms_pages").select("status").eq("id", pageId).single();
  if (!page) return json({ success: false, error: "Page not found" }, 404);

  await admin.from("cms_pages").update({
    status: targetStatus,
    updated_by: userId,
  }).eq("id", pageId);

  await audit(admin, "unpublish", userId, "cms_page", pageId, { status: page.status }, { status: targetStatus });

  return json({ success: true });
}

// ── Duplicate ──
async function duplicatePage(
  admin: ReturnType<typeof createClient>,
  body: { pageId: string; newSlug: string; newTitle: string },
  userId: string,
  rid: string
) {
  const { pageId, newSlug, newTitle } = body;
  if (!pageId || !newSlug || !newTitle) return json({ success: false, error: "pageId, newSlug, newTitle required" }, 400);

  const { data: src } = await admin.from("cms_pages").select("*").eq("id", pageId).single();
  if (!src) return json({ success: false, error: "Source page not found" }, 404);

  const { data: newPage, error } = await admin.from("cms_pages").insert({
    title: newTitle,
    slug: newSlug,
    seo_title: src.seo_title,
    seo_description: src.seo_description,
    is_home: false,
    status: "draft",
    created_by: userId,
    updated_by: userId,
  }).select("id").single();
  if (error) return json({ success: false, error: error.message }, 400);

  const { data: sections } = await admin.from("cms_sections").select("*").eq("page_id", pageId).order("sort_order");
  for (const s of sections || []) {
    await admin.from("cms_sections").insert({
      page_id: newPage.id,
      type: s.type,
      name: s.name,
      sort_order: s.sort_order,
      enabled: s.enabled,
      data: s.data,
    });
  }

  await audit(admin, "duplicate", userId, "cms_page", newPage.id, null, { source_page_id: pageId, slug: newSlug });

  return json({ success: true, data: { pageId: newPage.id } });
}

// ── Soft Delete ──
async function softDeletePage(
  admin: ReturnType<typeof createClient>,
  body: { pageId: string },
  userId: string,
  rid: string
) {
  const { pageId } = body;
  if (!pageId) return json({ success: false, error: "pageId required" }, 400);

  const { data: page } = await admin.from("cms_pages").select("*").eq("id", pageId).single();
  if (!page) return json({ success: false, error: "Page not found" }, 404);

  await admin.from("cms_pages").update({
    deleted_at: new Date().toISOString(),
    status: "archived",
    updated_by: userId,
  }).eq("id", pageId);

  await audit(admin, "soft_delete", userId, "cms_page", pageId, page, null);

  return json({ success: true });
}

// ── Restore (un-delete) ──
async function restorePage(
  admin: ReturnType<typeof createClient>,
  body: { pageId: string },
  userId: string,
  rid: string
) {
  const { pageId } = body;
  if (!pageId) return json({ success: false, error: "pageId required" }, 400);

  await admin.from("cms_pages").update({
    deleted_at: null,
    status: "draft",
    updated_by: userId,
  }).eq("id", pageId);

  await audit(admin, "restore", userId, "cms_page", pageId, null, { status: "draft" });

  return json({ success: true });
}

// ── Restore Revision ──
async function restoreRevision(
  admin: ReturnType<typeof createClient>,
  body: { pageId: string; revisionId: string },
  userId: string,
  rid: string
) {
  const { pageId, revisionId } = body;
  if (!pageId || !revisionId) return json({ success: false, error: "pageId and revisionId required" }, 400);

  const { data: rev } = await admin.from("cms_page_revisions").select("*").eq("id", revisionId).single();
  if (!rev) return json({ success: false, error: "Revision not found" }, 404);

  const snapshot = rev.snapshot as { page: Record<string, unknown>; sections: Record<string, unknown>[] };
  if (!snapshot?.page || !snapshot?.sections) return json({ success: false, error: "Invalid snapshot" }, 400);

  // Restore page fields
  await admin.from("cms_pages").update({
    title: snapshot.page.title,
    slug: snapshot.page.slug,
    seo_title: snapshot.page.seo_title || null,
    seo_description: snapshot.page.seo_description || null,
    is_home: snapshot.page.is_home || false,
    updated_by: userId,
  }).eq("id", pageId);

  // Delete current sections and re-insert from snapshot
  await admin.from("cms_sections").delete().eq("page_id", pageId);
  for (const s of snapshot.sections) {
    await admin.from("cms_sections").insert({
      page_id: pageId,
      type: s.type,
      name: s.name || null,
      sort_order: s.sort_order,
      enabled: s.enabled ?? true,
      data: s.data || {},
    });
  }

  await audit(admin, "restore_revision", userId, "cms_page", pageId, null, { revision_id: revisionId, version: rev.version });

  return json({ success: true });
}
