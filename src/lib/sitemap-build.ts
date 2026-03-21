/**
 * Logic สำหรับ build รายการ sitemap — ใช้ทั้ง metadata sitemap และ route ที่ส่ง XML พร้อม declaration
 * Pagination ใช้ fetchGqlLive (ไม่แคชรายหน้า) — รายการรวมยังใช้ unstable_cache ต่อรอบ
 */
import { unstable_cache } from "next/cache";
import { fetchGqlLive, siteUrl } from "@/lib/wp";
import { getSiteKey, includeHubNodeForSite } from "@/lib/site-key";
import { isPublicListableStatus } from "@/lib/content-filters";
import {
  Q_SERVICE_SLUGS_PAGINATED,
  Q_LOCATION_SLUGS_PAGINATED,
  Q_PRICE_SLUGS_PAGINATED,
  Q_DEVICECATEGORY_SLUGS_PAGINATED,
} from "@/lib/queries";

export const SITEMAP_REVALIDATE = 86400;
/** จำกัด URL ต่อ 1 sitemap segment เพื่อลด timeout */
export const URLS_PER_SEGMENT = Number(process.env.SITEMAP_URLS_PER_SEGMENT) || 400;
/** กัน sitemap index โตเกิน + กัน loop ไม่จบ */
export const SEGMENTS_MAX = Number(process.env.SITEMAP_SEGMENTS_MAX) || 50;
/** ต่อ 1 request ไป WP (ms) — บน VPS แนะนำ 8000–15000 */
const SITEMAP_WP_TIMEOUT_MS = Number(process.env.SITEMAP_WP_TIMEOUT_MS) || 12000;
/** Timeout ทั้ง route (ms) — กัน request ค้าง */
const SITEMAP_REQUEST_TIMEOUT_MS = Number(process.env.SITEMAP_REQUEST_TIMEOUT_MS) || 15000;
/** ดึงครั้งละเท่านี้ (WP มักจำกัด first ที่ 100) */
const SITEMAP_PAGE_SIZE = 100;
/** สูงสุดกี่รอบ (กัน loop ไม่จบ) */
const SITEMAP_MAX_PAGES = 20;
/** content ที่เยอะ: services (default สูงกว่า) */
const SITEMAP_SERVICE_MAX_PAGES = Number(process.env.SITEMAP_SERVICE_MAX_PAGES) || 50;

/** รายการใน sitemap: สอดคล้องหน้าเว็บ (รวม status ว่าง) + กรอง site แบบ hub */
function sitemapIncludePublishedNode(n: { status?: string; site?: string }): boolean {
  return isPublicListableStatus(n?.status) && includeHubNodeForSite(n?.site);
}

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  const items: SitemapEntry[] = [];
  const seen = new Set<string>();

  function push(
    url: string,
    changeFrequency: SitemapEntry["changeFrequency"],
    priority: number
  ) {
    const u = url.replace(/\/$/, "");
    if (seen.has(u)) return;
    seen.add(u);
    items.push({ url: u, lastModified: now, changeFrequency, priority });
  }

  push(`${base}/`, "daily", 1);
  push(`${base}/categories`, "daily", 0.9);
  push(`${base}/locations`, "weekly", 0.7);
  push(`${base}/privacy-policy`, "monthly", 0.3);
  push(`${base}/terms`, "monthly", 0.3);

  // NOTE: Blueprint ใหม่ให้แยก services เป็น segmented sitemap; ฟังก์ชันนี้คงไว้เพื่อใช้งานอื่น
  // และใช้ข้อมูลแบบ cache ระดับดิบ (ดึงทั้งหมด 1 ครั้ง แล้ว slice เมื่อจำเป็น)
  try {
    const [svcNodes, locNodes, priNodes, catNodes] = await withRouteTimeout(
      Promise.all([
        getAllServiceSlugNodes(),
        getAllLocationSlugNodes(),
        getAllPriceSlugNodes(),
        getAllCategorySlugNodes(),
      ])
    );
    for (const n of svcNodes) push(`${base}/services/${n.slug}`, "weekly", 0.9);
    for (const n of locNodes) push(`${base}/locations/${n.slug}`, "weekly", 0.8);
    for (const n of priNodes) push(`${base}/prices/${n.slug}`, "weekly", 0.7);
    for (const n of catNodes) push(`${base}/categories/${n.slug}`, "weekly", 0.6);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sitemap] WP fetch failed, using static pages only:", (err as Error)?.message ?? err);
    }
  }

  return items;
}

/** สร้าง XML string พร้อม XML declaration — ให้ Google ดึงได้ */
export function sitemapEntriesToXml(entries: SitemapEntry[]): string {
  const urlset = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeXml(e.url)}</loc>\n    <lastmod>${e.lastModified.toISOString()}</lastmod>\n    <changefreq>${e.changeFrequency}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;
}

/** Sitemap urlset ว่าง (สถานะ 200) — ใช้เมื่อ segment ไม่อยู่ใน range */
export function getEmptyUrlsetXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
}

/** Sitemap Index (รวมลิงก์ไปยัง sitemap ย่อย) — รูปแบบ sitemaps.org */
export function buildSitemapIndexXml(sitemaps: { loc: string; lastmod?: string }[]): string {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date().toISOString().replace("Z", "+00:00");
  const entries = sitemaps
    .map(
      (s) =>
        `  <sitemap>\n    <loc>${escapeXml(s.loc)}</loc>\n    <lastmod>${s.lastmod ?? now}</lastmod>\n  </sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">
${entries}
</sitemapindex>
`;
}

/** หน้า static (ไม่ดึง WP) */
export function getPagesEntries(): SitemapEntry[] {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/locations`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}

function cacheKey(...parts: string[]) {
  return ["sitemap", getSiteKey(), ...parts];
}

function withTimeout<T>(promise: Promise<T>, ms: number, label = "timeout"): Promise<T> {
  const t = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(label)), ms));
  return Promise.race([promise, t]);
}

function withRouteTimeout<T>(promise: Promise<T>): Promise<T> {
  return withTimeout(promise, SITEMAP_REQUEST_TIMEOUT_MS, "sitemap route timeout");
}

async function fetchOne<T>(
  query: string,
  _revalidateUnused = SITEMAP_REVALIDATE,
  variables?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await withTimeout(
      fetchGqlLive<T>(query, variables),
      SITEMAP_WP_TIMEOUT_MS,
      "sitemap WP timeout"
    );
  } catch {
    return null;
  }
}

type PaginatedConnection<T> = {
  pageInfo?: { hasNextPage?: boolean; endCursor?: string };
  nodes?: T[];
};

/** ดึง nodes ทั้งหมดแบบแบ่งหน้า (หลีกเลี่ยง limit 100 ของ WP) */
async function fetchAllPaginated<TNode>(
  query: string,
  getConnection: (data: Record<string, unknown>) => unknown
  , maxPages = SITEMAP_MAX_PAGES
): Promise<TNode[]> {
  const all: TNode[] = [];
  let after: string | null = null;
  for (let p = 0; p < maxPages; p++) {
    const data: Record<string, unknown> | null = await fetchOne<Record<string, unknown>>(
      query,
      SITEMAP_REVALIDATE,
      { first: SITEMAP_PAGE_SIZE, after }
    );
    const conn: PaginatedConnection<TNode> | null = (data ? getConnection(data) : null) as PaginatedConnection<TNode> | null;
    const nodes = conn?.nodes ?? [];
    all.push(...nodes);
    if (!conn?.pageInfo?.hasNextPage || !conn?.pageInfo?.endCursor) break;
    after = conn.pageInfo.endCursor;
  }
  return all;
}

type SlugNode = { slug: string };
type ServiceSlugNode = { slug?: string; status?: string; site?: string };
type PublishSlugNode = { slug?: string; status?: string; site?: string };
type CategorySlugNode = { slug?: string; site?: string };

function toSlugNodes<T extends { slug?: string }>(nodes: T[], pick: (n: T) => boolean): SlugNode[] {
  const out: SlugNode[] = [];
  const seen = new Set<string>();
  for (const n of nodes) {
    const slug = String(n?.slug ?? "").trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    if (!pick(n)) continue;
    seen.add(slug);
    out.push({ slug });
  }
  return out;
}

let inFlightServices: Promise<SlugNode[]> | null = null;
let inFlightLocations: Promise<SlugNode[]> | null = null;
let inFlightPrices: Promise<SlugNode[]> | null = null;
let inFlightCategories: Promise<SlugNode[]> | null = null;

/** ดึง slug nodes ทั้งหมด 1 ครั้ง (paginate) แล้ว cache 24 ชม. — services เยอะ ใช้เพดาน paginate สูงกว่า */
export async function getAllServiceSlugNodes(): Promise<SlugNode[]> {
  const cached = unstable_cache(
    async () => {
      const nodes = await fetchAllPaginated<ServiceSlugNode>(
        Q_SERVICE_SLUGS_PAGINATED,
        (d) => d?.services,
        SITEMAP_SERVICE_MAX_PAGES
      );
      return toSlugNodes(nodes, (n) => sitemapIncludePublishedNode(n));
    },
    cacheKey("services-all-slugs-v2"),
    { revalidate: SITEMAP_REVALIDATE, tags: ["sitemap", "wp"] }
  );
  if (!inFlightServices) inFlightServices = cached().finally(() => (inFlightServices = null));
  return inFlightServices;
}

export async function getAllLocationSlugNodes(): Promise<SlugNode[]> {
  const cached = unstable_cache(
    async () => {
      const nodes = await fetchAllPaginated<PublishSlugNode>(
        Q_LOCATION_SLUGS_PAGINATED,
        (d) => d?.locationpages,
        SITEMAP_MAX_PAGES
      );
      return toSlugNodes(nodes, (n) => sitemapIncludePublishedNode(n));
    },
    cacheKey("locations-all-slugs-v2"),
    { revalidate: SITEMAP_REVALIDATE, tags: ["sitemap", "wp"] }
  );
  if (!inFlightLocations) inFlightLocations = cached().finally(() => (inFlightLocations = null));
  return inFlightLocations;
}

export async function getAllPriceSlugNodes(): Promise<SlugNode[]> {
  const cached = unstable_cache(
    async () => {
      const nodes = await fetchAllPaginated<PublishSlugNode>(
        Q_PRICE_SLUGS_PAGINATED,
        (d) => d?.pricemodels,
        SITEMAP_MAX_PAGES
      );
      return toSlugNodes(nodes, (n) => sitemapIncludePublishedNode(n));
    },
    cacheKey("prices-all-slugs-v2"),
    { revalidate: SITEMAP_REVALIDATE, tags: ["sitemap", "wp"] }
  );
  if (!inFlightPrices) inFlightPrices = cached().finally(() => (inFlightPrices = null));
  return inFlightPrices;
}

export async function getAllCategorySlugNodes(): Promise<SlugNode[]> {
  const cached = unstable_cache(
    async () => {
      const nodes = await fetchAllPaginated<CategorySlugNode>(
        Q_DEVICECATEGORY_SLUGS_PAGINATED,
        (d) => d?.devicecategories,
        SITEMAP_MAX_PAGES
      );
      return toSlugNodes(nodes, (n) => includeHubNodeForSite(n?.site));
    },
    cacheKey("categories-all-slugs-v2"),
    { revalidate: SITEMAP_REVALIDATE, tags: ["sitemap", "wp"] }
  );
  if (!inFlightCategories) inFlightCategories = cached().finally(() => (inFlightCategories = null));
  return inFlightCategories;
}

/** จำนวน segment สำหรับ services (ceil(total/400)) + cap ด้วย SEGMENTS_MAX */
export async function getServiceSegmentsCount(): Promise<number> {
  const cached = unstable_cache(
    async () => {
      const total = (await getAllServiceSlugNodes()).length;
      const count = Math.max(1, Math.ceil(total / URLS_PER_SEGMENT));
      return Math.min(count, SEGMENTS_MAX);
    },
    cacheKey("services-segments-count-v2"),
    { revalidate: SITEMAP_REVALIDATE, tags: ["sitemap", "wp"] }
  );
  return cached();
}

export async function getServiceEntriesForSegment(segmentNum: number): Promise<SitemapEntry[]> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  const i = Number(segmentNum);
  if (!Number.isFinite(i) || i < 1) return [];
  const nodes = await getAllServiceSlugNodes();
  const totalSegments = await getServiceSegmentsCount();
  if (i > totalSegments) return [];
  const start = (i - 1) * URLS_PER_SEGMENT;
  const slice = nodes.slice(start, start + URLS_PER_SEGMENT);
  return slice.map((n) => ({
    url: `${base}/services/${n.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));
}

/** Locations จาก WP — แบ่งหน้าดึงเกิน 100 ได้ */
export async function getLocationsEntries(): Promise<SitemapEntry[]> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  const nodes = await fetchAllPaginated<{ slug?: string; status?: string; site?: string }>(
    Q_LOCATION_SLUGS_PAGINATED,
    (d) => d?.locationpages
  );
  const items: SitemapEntry[] = [];
  for (const n of nodes) {
    if (!n?.slug || !sitemapIncludePublishedNode(n)) continue;
    items.push({ url: `${base}/locations/${n.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
  }
  return items;
}

/** Services จาก WP — แบ่งหน้าดึงเกิน 100 ได้ */
export async function getServicesEntries(): Promise<SitemapEntry[]> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  const nodes = await getAllServiceSlugNodes();
  return nodes.map((n) => ({
    url: `${base}/services/${n.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));
}

/** Categories (devicecategories) จาก WP — แบ่งหน้าดึงเกิน 100 ได้ */
export async function getCategoriesEntries(): Promise<SitemapEntry[]> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  const nodes = await fetchAllPaginated<{ slug?: string; site?: string }>(
    Q_DEVICECATEGORY_SLUGS_PAGINATED,
    (d) => d?.devicecategories
  );
  const items: SitemapEntry[] = [];
  for (const n of nodes) {
    if (!n?.slug || !includeHubNodeForSite(n?.site)) continue;
    items.push({ url: `${base}/categories/${n.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  }
  return items;
}

/** Prices จาก WP — แบ่งหน้าดึงเกิน 100 ได้ */
export async function getPricesEntries(): Promise<SitemapEntry[]> {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date();
  const nodes = await fetchAllPaginated<{ slug?: string; status?: string; site?: string }>(
    Q_PRICE_SLUGS_PAGINATED,
    (d) => d?.pricemodels
  );
  const items: SitemapEntry[] = [];
  for (const n of nodes) {
    if (!n?.slug || !sitemapIncludePublishedNode(n)) continue;
    items.push({ url: `${base}/prices/${n.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
  }
  return items;
}

/** Sitemap XML ขั้นต่ำ (แค่หน้าแรก) — ใช้เมื่อ error เพื่อไม่ให้ Google ได้ 500 */
export function getMinimalSitemapXml(): string {
  const base = siteUrl().replace(/\/$/, "");
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeXml(base + "/")}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1</priority>\n  </url>\n</urlset>`;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
