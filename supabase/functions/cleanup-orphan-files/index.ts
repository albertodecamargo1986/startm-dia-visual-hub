import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKETS = ["customer-files", "artwork-files"];

function log(data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), fn: "cleanup-orphan-files", ...data }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "dry_run"; // dry_run | apply
  const daysThreshold = parseInt(url.searchParams.get("days_threshold") || "30", 10);

  if (!["dry_run", "apply"].includes(mode)) {
    return new Response(JSON.stringify({ error: "mode must be dry_run or apply" }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const allResults: Array<{ bucket: string; total_orphans: number; bytes_freed: number; errors: number; details: unknown[] }> = [];

  try {
    for (const bucket of BUCKETS) {
      const result = await processBucket(supabase, bucket, mode, daysThreshold);
      allResults.push(result);

      // Save report
      await supabase.from("cleanup_reports").insert({
        mode,
        bucket,
        total_orphans: result.total_orphans,
        bytes_freed: result.bytes_freed,
        errors: result.errors,
        details: result.details,
        finished_at: new Date().toISOString(),
      });
    }

    // Notify admins
    const totalOrphans = allResults.reduce((s, r) => s + r.total_orphans, 0);
    const totalBytes = allResults.reduce((s, r) => s + r.bytes_freed, 0);
    const totalErrors = allResults.reduce((s, r) => s + r.errors, 0);

    if (totalOrphans > 0 || totalErrors > 0) {
      // Get admin emails
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "super_admin"]);

      if (admins && admins.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email")
          .in("user_id", admins.map((a) => a.user_id))
          .neq("email", "");

        // We need an order_id for notifications_queue — use a dummy approach:
        // Insert a summary notification without order reference isn't possible due to NOT NULL constraint.
        // Instead, just log. Admins can check cleanup_reports table.
        log({
          event: "cleanup_summary",
          mode,
          totalOrphans,
          totalBytes,
          totalErrors,
          adminEmails: profiles?.map((p) => p.email) || [],
        });
      }
    }

    log({ event: "done", mode, results: allResults.map((r) => ({ bucket: r.bucket, orphans: r.total_orphans, bytes: r.bytes_freed, errors: r.errors })) });

    return new Response(JSON.stringify({ mode, results: allResults }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log({ event: "unhandled_error", error: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});

async function processBucket(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  mode: string,
  daysThreshold: number
) {
  const details: Array<{ path: string; reason: string; size: number; error?: string }> = [];
  let totalOrphans = 0;
  let bytesFreed = 0;
  let errors = 0;

  // List all files in the bucket (root folder)
  const allFiles = await listAllFiles(supabase, bucket, "");

  if (allFiles.length === 0) {
    log({ event: "bucket_empty", bucket });
    return { bucket, total_orphans: 0, bytes_freed: 0, errors: 0, details: [] };
  }

  log({ event: "bucket_scan", bucket, fileCount: allFiles.length });

  // Get all referenced file URLs from customer_files
  const { data: referencedFiles } = await supabase
    .from("customer_files")
    .select("file_url, order_item_id");

  const referencedUrls = new Set((referencedFiles || []).map((f) => f.file_url));

  // Get order_items with their order status and cancellation date
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id, order_id");

  const orderItemMap = new Map((orderItems || []).map((oi) => [oi.id, oi.order_id]));

  // Get cancelled orders with their updated_at
  const { data: cancelledOrders } = await supabase
    .from("orders")
    .select("id, status, updated_at")
    .in("status", ["cancelled", "refunded"]);

  const cancelledOrderMap = new Map(
    (cancelledOrders || []).map((o) => [o.id, new Date(o.updated_at!)])
  );

  const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

  for (const file of allFiles) {
    const filePath = file.name;
    const fileSize = file.metadata?.size || 0;

    // Build possible URLs that could reference this file
    const possibleUrl1 = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${bucket}/${filePath}`;
    const possibleUrl2 = `${bucket}/${filePath}`;

    // Check if referenced
    const isReferenced = referencedUrls.has(possibleUrl1) || referencedUrls.has(possibleUrl2) || referencedUrls.has(filePath);

    // Also check by matching partial paths
    let foundRef = isReferenced;
    let refOrderItemId: string | null = null;

    if (!foundRef) {
      for (const ref of referencedFiles || []) {
        if (ref.file_url && (ref.file_url.includes(filePath) || filePath.includes(ref.file_url))) {
          foundRef = true;
          refOrderItemId = ref.order_item_id;
          break;
        }
      }
    } else {
      const matchedRef = (referencedFiles || []).find(
        (r) => r.file_url === possibleUrl1 || r.file_url === possibleUrl2 || r.file_url === filePath
      );
      refOrderItemId = matchedRef?.order_item_id || null;
    }

    let reason = "";

    if (!foundRef) {
      reason = "no_reference";
    } else if (refOrderItemId) {
      // Check if the associated order is cancelled beyond threshold
      const orderId = orderItemMap.get(refOrderItemId);
      if (orderId && cancelledOrderMap.has(orderId)) {
        const cancelledAt = cancelledOrderMap.get(orderId)!;
        if (cancelledAt < cutoffDate) {
          reason = `order_cancelled_${Math.floor((Date.now() - cancelledAt.getTime()) / 86400000)}d_ago`;
        }
      }
    }

    if (!reason) continue; // Not orphan

    totalOrphans++;
    bytesFreed += fileSize;

    if (mode === "apply") {
      const { error: delError } = await supabase.storage.from(bucket).remove([filePath]);
      if (delError) {
        errors++;
        details.push({ path: filePath, reason, size: fileSize, error: delError.message });
        log({ event: "delete_error", bucket, path: filePath, error: delError.message });
      } else {
        details.push({ path: filePath, reason, size: fileSize });
        log({ event: "deleted", bucket, path: filePath, size: fileSize });
      }
    } else {
      details.push({ path: filePath, reason, size: fileSize });
    }
  }

  return { bucket, total_orphans: totalOrphans, bytes_freed: bytesFreed, errors, details };
}

async function listAllFiles(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  folder: string
): Promise<Array<{ name: string; metadata?: { size?: number } }>> {
  const results: Array<{ name: string; metadata?: { size?: number } }> = [];

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1000,
    offset: 0,
  });

  if (error || !data) return results;

  for (const item of data) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;

    if (item.id) {
      // It's a file
      results.push({ name: fullPath, metadata: { size: (item.metadata as Record<string, unknown>)?.size as number || 0 } });
    } else {
      // It's a folder, recurse
      const subFiles = await listAllFiles(supabase, bucket, fullPath);
      results.push(...subFiles);
    }
  }

  return results;
}
