/**
 * Sitemap Index — /sitemap.xml รวมลิงก์ไปยัง sitemap ย่อย (แยกตามหมวด)
 * ไม่ throw เพื่อให้ GSC ดึงได้เสมอ
 */
import { siteUrl } from "@/lib/wp";
import { buildSitemapIndexXml, getServiceSegmentsCount } from "@/lib/sitemap-build";

export const revalidate = 86400;
export const runtime = "nodejs";

const HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;

export async function GET() {
  try {
    const base = siteUrl().replace(/\/$/, "");
    const serviceSegments = await getServiceSegmentsCount().catch(() => 1);
    const sitemaps: { loc: string }[] = [
      { loc: `${base}/sitemap-pages.xml` },
      { loc: `${base}/sitemap-locations.xml` },
      { loc: `${base}/sitemap-categories.xml` },
      { loc: `${base}/sitemap-prices.xml` },
    ];
    // services แยกเป็น segment 1..N (อย่าลิสต์เกินจริง)
    for (let i = 1; i <= serviceSegments; i++) {
      sitemaps.push({ loc: `${base}/sitemap-services/${i}.xml` });
    }
    const xml = buildSitemapIndexXml(sitemaps);
    return new Response(xml, { status: 200, headers: HEADERS });
  } catch {
    const base = siteUrl().replace(/\/$/, "") || "https://example.com";
    const xml = buildSitemapIndexXml([{ loc: `${base}/sitemap-pages.xml` }]);
    return new Response(xml, { status: 200, headers: HEADERS });
  }
}
