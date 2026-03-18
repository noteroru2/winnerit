/**
 * Sitemap services (segmented) — /sitemap-services/{segment}.xml
 * Segment ละ URLS_PER_SEGMENT (default 400) เพื่อลด timeout และคุมขนาดไฟล์
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

export async function GET(_: Request, ctx: { params: { segment: string } }) {
  try {
    const seg = Number(ctx?.params?.segment);
    const entries = await getServiceEntriesForSegment(seg);
    const xml = entries.length ? sitemapEntriesToXml(entries) : getEmptyUrlsetXml();
    return new Response(xml, { status: 200, headers: HEADERS });
  } catch {
    const xml = getMinimalSitemapXml();
    return new Response(xml, { status: 200, headers: HEADERS });
  }
}

