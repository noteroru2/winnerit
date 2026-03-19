/**
 * Cached WordPress list fetches — แบบ webuy-hub-v2:
 * unstable_cache + in-flight coalesce (หลาย request พร้อมกัน → ยิง WP ครั้งเดียว)
 */
import { unstable_cache } from "next/cache";
import { fetchGql } from "@/lib/wp";
import { getSiteKey } from "@/lib/site-key";
import {
  Q_SERVICES_LIST,
  Q_SERVICE_SLUGS,
  Q_SERVICE_BY_SLUG,
  Q_LOCATIONPAGES_LIST,
  Q_LOCATION_SLUGS,
  Q_LOCATION_BY_SLUG,
  Q_PRICEMODELS_LIST,
  Q_PRICE_BY_SLUG,
  Q_HUB_INDEX,
  Q_SERVICE_RELATED_INDEX,
  Q_DEVICECATEGORY_BY_SLUG,
  Q_DEVICECATEGORY_SLUGS,
  Q_PRICE_SLUGS,
  Q_SITE_SETTINGS,
} from "@/lib/queries";

const CACHE_TAG = "wp-lists";
/** Hub query หนัก — revalidate ยาวเหมือน webuy-hub-v2 */
const HUB_REVALIDATE = 86400;
const LIST_REVALIDATE = 3600;

function cacheKey(...parts: string[]) {
  return [CACHE_TAG, getSiteKey(), ...parts];
}

const inFlightMap: Record<string, Promise<unknown> | null> = {
  hub: null,
  categorySlugs: null,
};

function coalesce<T>(key: keyof typeof inFlightMap, fn: () => Promise<T>): Promise<T> {
  const p = inFlightMap[key];
  if (p) return p as Promise<T>;
  const promise = fn().finally(() => {
    inFlightMap[key] = null;
  });
  inFlightMap[key] = promise;
  return promise;
}

/** Cache Hub Index — coalesce + revalidate 24 ชม. (แบบ webuy-hub-v2) */
export async function getCachedHubIndex() {
  return coalesce("hub", () =>
    unstable_cache(
      async () => fetchGql<any>(Q_HUB_INDEX, undefined, { revalidate: HUB_REVALIDATE }),
      cacheKey("hub-index"),
      { revalidate: HUB_REVALIDATE, tags: [CACHE_TAG, "wp"] }
    )()
  );
}

/** Cache a smaller index for service detail related sections */
export async function getCachedServiceRelatedIndex() {
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICE_RELATED_INDEX, undefined, { revalidate: HUB_REVALIDATE }),
    cacheKey("service-related-index"),
    { revalidate: HUB_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

export async function getCachedServicesList() {
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICES_LIST, undefined, { revalidate: LIST_REVALIDATE }),
    cacheKey("services"),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Lightweight cached slugs for validation & static params (no content) */
export async function getCachedServiceSlugs() {
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICE_SLUGS, undefined, { revalidate: LIST_REVALIDATE }),
    cacheKey("service-slugs"),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached fetch for a single service by slug (avoids downloading the full list) */
export async function getCachedServiceBySlug(slug: string) {
  const s = String(slug || "").trim().toLowerCase();
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICE_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE }),
    cacheKey("service-by-slug", s),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

export async function getCachedLocationpagesList() {
  return unstable_cache(
    async () => fetchGql<any>(Q_LOCATIONPAGES_LIST, undefined, { revalidate: LIST_REVALIDATE }),
    cacheKey("locationpages"),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

export async function getCachedPricemodelsList() {
  return unstable_cache(
    async () => fetchGql<any>(Q_PRICEMODELS_LIST, undefined, { revalidate: LIST_REVALIDATE }),
    cacheKey("pricemodels"),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached location by slug — ใช้ทั้ง metadata และ page (dedupe ต่อ request ได้กับ React cache()) */
export async function getCachedLocationBySlug(slug: string) {
  const s = String(slug || "").trim().toLowerCase();
  return unstable_cache(
    async () => fetchGql<any>(Q_LOCATION_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE }),
    cacheKey("location-by-slug", s),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached location slugs (เบา) — ใช้ validate / fallback ใน location page */
export async function getCachedLocationSlugs() {
  return unstable_cache(
    async () => fetchGql<any>(Q_LOCATION_SLUGS, undefined, { revalidate: LIST_REVALIDATE }),
    cacheKey("location-slugs"),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached category by slug — ใช้ทั้ง metadata และ page */
export async function getCachedCategoryBySlug(slug: string) {
  const s = String(slug || "").trim();
  return unstable_cache(
    async () => fetchGql<any>(Q_DEVICECATEGORY_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE }),
    cacheKey("category-by-slug", s),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached price by slug — ใช้ทั้ง metadata และ page */
export async function getCachedPriceBySlug(slug: string) {
  const s = String(slug || "").trim().toLowerCase();
  return unstable_cache(
    async () => fetchGql<any>(Q_PRICE_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE }),
    cacheKey("price-by-slug", s),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached site settings — ใช้ใน location page (LocalBusiness JSON-LD) */
export async function getCachedSiteSettings() {
  return unstable_cache(
    async () => fetchGql<any>(Q_SITE_SETTINGS, undefined, { revalidate: LIST_REVALIDATE }),
    cacheKey("site-settings"),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached price slugs (เบา) — ใช้ใน sitemap */
export async function getCachedPriceSlugs() {
  return unstable_cache(
    async () => fetchGql<any>(Q_PRICE_SLUGS, undefined, { revalidate: LIST_REVALIDATE }),
    cacheKey("price-slugs"),
    { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached category slugs (เบา) — ใช้หน้าแรก + sitemap; coalesce กับ hub */
export async function getCachedCategorySlugs() {
  return coalesce("categorySlugs", () =>
    unstable_cache(
      async () => fetchGql<any>(Q_DEVICECATEGORY_SLUGS, undefined, { revalidate: LIST_REVALIDATE }),
      cacheKey("category-slugs"),
      { revalidate: LIST_REVALIDATE, tags: [CACHE_TAG, "wp"] }
    )()
  );
}
