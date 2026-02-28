/**
 * Sitemap ตาม Next.js Metadata convention — ให้ Google Search Console ดึง /sitemap.xml ได้
 * ใช้ไฟล์นี้แทน route handler เพื่อความเข้ากันได้กับ crawler
 */
import type { MetadataRoute } from "next";
import { getSitemapEntries, getPagesEntries } from "@/lib/sitemap-build";

export const revalidate = 86400;

function toMetadataEntry(e: { url: string; lastModified: Date; changeFrequency: string; priority: number }): MetadataRoute.Sitemap[number] {
  return {
    url: e.url,
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: e.priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await getSitemapEntries();
    return entries.map(toMetadataEntry);
  } catch {
    const fallback = getPagesEntries();
    return fallback.map(toMetadataEntry);
  }
}
