import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function log(data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), fn: "health-check", ...data }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const checks: Record<string, { ok: boolean; detail: string }> = {};
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  try {
    // 1. DB connectivity
    const { error: pingErr } = await supabase.rpc("generate_order_number").then(() => ({ error: null })).catch((e: Error) => ({ error: e }));
    // Simple select instead
    const { data: pingData, error: dbErr } = await supabase.from("site_settings").select("id").limit(1);
    checks.db_connectivity = dbErr
      ? { ok: false, detail: dbErr.message }
      : { ok: true, detail: "OK" };

    // 2. Critical table counts
    const tables = ["orders", "profiles", "products"] as const;
    for (const table of tables) {
      const { count, error: cErr } = await supabase.from(table).select("id", { count: "exact", head: true });
      if (cErr) {
        checks[`table_${table}`] = { ok: false, detail: cErr.message };
      } else {
        const c = count ?? 0;
        const threshold = table === "products" ? 1 : 0;
        checks[`table_${table}`] = {
          ok: c >= threshold,
          detail: `count=${c}${c < threshold ? " (below threshold)" : ""}`,
        };
      }
    }

    // 3. Storage buckets
    const buckets = ["product-images", "customer-files"];
    for (const bucket of buckets) {
      const { data: files, error: sErr } = await supabase.storage.from(bucket).list("", { limit: 1 });
      checks[`storage_${bucket}`] = sErr
        ? { ok: false, detail: sErr.message }
        : { ok: true, detail: `accessible (${files?.length ?? 0} sample files)` };
    }

    // 4. Recent orders (last 30 days activity check)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count: recentOrders, error: roErr } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);
    checks.recent_orders_30d = roErr
      ? { ok: false, detail: roErr.message }
      : { ok: true, detail: `count=${recentOrders ?? 0}` };

    // Determine overall status
    const failedChecks = Object.values(checks).filter((c) => !c.ok);
    if (failedChecks.length === 0) {
      overallStatus = "healthy";
    } else if (failedChecks.length <= 2) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    // 5. Persist result
    await supabase.from("health_checks").insert({
      status: overallStatus,
      details: checks,
    });

    // 6. Alert admin if not healthy
    if (overallStatus !== "healthy") {
      const failedNames = Object.entries(checks)
        .filter(([, v]) => !v.ok)
        .map(([k]) => k)
        .join(", ");

      // Get any admin email to send alert
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("email, user_id")
        .limit(10);

      if (adminProfiles) {
        for (const profile of adminProfiles) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id)
            .in("role", ["admin", "super_admin"]);

          if (roles && roles.length > 0) {
            // We can't insert into notifications_queue directly (no RLS insert for service role via client)
            // but service role bypasses RLS, so it should work
            await supabase.from("notifications_queue").insert({
              order_id: "00000000-0000-0000-0000-000000000000",
              event_type: "health_check_alert",
              recipient_type: "admin",
              recipient_email: profile.email,
              payload: {
                status: overallStatus,
                failedChecks: failedNames,
                timestamp: new Date().toISOString(),
              },
            });
            break; // Alert first admin found
          }
        }
      }
    }

    log({ event: "check_complete", status: overallStatus, checks });

    return new Response(JSON.stringify({ status: overallStatus, checks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log({ event: "unhandled_error", error: msg });
    return new Response(JSON.stringify({ status: "unhealthy", error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
