/**
 * Sitemap services — /sitemap-services.xml
 */
import { getServiceEntriesForSegment, sitemapEntriesToXml, getMinimalSitemapXml } from "@/lib/sitemap-build";

export const revalidate = 86400;
export const runtime = "nodejs";

const HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;

export async function GET() {
  try {
    // Backward-compat: sitemap-services.xml ให้ชี้เทียบเท่า segment 1
    const entries = await getServiceEntriesForSegment(1);
    const xml = entries.length ? sitemapEntriesToXml(entries) : getMinimalSitemapXml();
    return new Response(xml, { status: 200, headers: HEADERS });
  } catch {
    const xml = getMinimalSitemapXml();
    return new Response(xml, { status: 200, headers: HEADERS });
  }
}
