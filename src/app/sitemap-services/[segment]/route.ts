/**
 * Sitemap services (segmented) — /sitemap-services/{segment}
 * รูปแบบเดียวกับ webuy (ไม่มี .xml ใน path) เพื่อให้ GSC ดึงได้
 * Segment ละ URLS_PER_SEGMENT (default 400)
 */
import {
  getEmptyUrlsetXml,
  getMinimalSitemapXml,
  getServiceEntriesForSegment,
  sitemapEntriesToXml,
} from "@/lib/sitemap-build";

export const revalidate = 86400;
export const runtime = "nodejs";

const HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;

type RouteContext = { params: Promise<{ segment: string }> | { segment: string } };

export async function GET(_: Request, ctx: { params: RouteContext["params"] }) {
  try {
    const params = await Promise.resolve(ctx.params);
    const seg = Number(params?.segment);
    const entries = await getServiceEntriesForSegment(seg);
    const xml = entries.length ? sitemapEntriesToXml(entries) : getEmptyUrlsetXml();
    return new Response(xml, { status: 200, headers: HEADERS });
  } catch {
    const xml = getMinimalSitemapXml();
    return new Response(xml, { status: 200, headers: HEADERS });
  }
}
