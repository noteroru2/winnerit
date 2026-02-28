/**
 * Sitemap Index — /sitemap.xml ชี้ไปยัง sitemap ย่อยแยกตามหมวด
 * ไม่ดึง WP เลย จึงตอบได้เสมอ; แต่ละไฟล์ย่อยดึง WP แยกกัน (ล้มได้แค่ไฟล์นั้น)
 */
import { siteUrl } from "@/lib/wp";
import { buildSitemapIndexXml } from "@/lib/sitemap-build";

export const revalidate = 86400;
export const runtime = "edge";

const HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;

export async function GET() {
  try {
    const base = siteUrl().replace(/\/$/, "");
    const sitemaps = [
      { loc: `${base}/sitemap-pages.xml` },
      { loc: `${base}/sitemap-locations.xml` },
      { loc: `${base}/sitemap-services.xml` },
      { loc: `${base}/sitemap-categories.xml` },
      { loc: `${base}/sitemap-prices.xml` },
    ];
    const xml = buildSitemapIndexXml(sitemaps);
    return new Response(xml, { status: 200, headers: HEADERS });
  } catch {
    const base = "https://webuy.in.th";
    const xml = buildSitemapIndexXml([{ loc: `${base}/sitemap-pages.xml` }]);
    return new Response(xml, { status: 200, headers: HEADERS });
  }
}
