import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://startmidialimeira.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch active products and categories in parallel
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("active", true).order("prod_order"),
      supabase.from("categories").select("slug, created_at").eq("active", true).order("cat_order"),
    ]);

    const products = productsRes.data ?? [];
    const categories = categoriesRes.data ?? [];
    const today = new Date().toISOString().split("T")[0];

    const urls: { loc: string; changefreq: string; priority: string; lastmod?: string }[] = [
      { loc: "/", changefreq: "weekly", priority: "1.0", lastmod: today },
      { loc: "/produtos", changefreq: "daily", priority: "0.9", lastmod: today },
      { loc: "/sobre", changefreq: "monthly", priority: "0.7" },
      { loc: "/portfolio", changefreq: "weekly", priority: "0.8" },
      { loc: "/contato", changefreq: "monthly", priority: "0.8" },
      { loc: "/privacidade", changefreq: "monthly", priority: "0.3" },
    ];

    // Category pages
    for (const cat of categories) {
      urls.push({
        loc: `/produtos/${cat.slug}`,
        changefreq: "weekly",
        priority: "0.8",
        lastmod: cat.created_at ? cat.created_at.split("T")[0] : undefined,
      });
    }

    // Product pages
    for (const prod of products) {
      urls.push({
        loc: `/produto/${prod.slug}`,
        changefreq: "weekly",
        priority: "0.7",
        lastmod: prod.updated_at ? prod.updated_at.split("T")[0] : undefined,
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
