/**
 * Cached WordPress list fetches for static build.
 * ใช้ unstable_cache เพื่อดึง list แค่ครั้งเดียวตลอด build แทนการดึงซ้ำทุกหน้า
 * (ลดจาก 61+ ครั้งเหลือ 1 ครั้งต่อ list → ลด timeout/rate limit)
 */
import { unstable_cache } from "next/cache";
import { fetchGql } from "@/lib/wp";
import { getSiteKey } from "@/lib/site-key";
import {
  Q_SERVICES_LIST,
  Q_SERVICE_SLUGS,
  Q_SERVICE_BY_SLUG,
  Q_LOCATIONPAGES_LIST,
  Q_PRICEMODELS_LIST,
  Q_HUB_INDEX,
  Q_SERVICE_RELATED_INDEX,
} from "@/lib/queries";

const CACHE_TAG = "wp-lists";
const REVALIDATE = 3600;

function cacheKey(...parts: string[]) {
  return [CACHE_TAG, getSiteKey(), ...parts];
}

/** Cache Hub Index — ใช้ใน category/location/service/price pages; tag "wp" ให้ revalidate API ล้างได้ */
export async function getCachedHubIndex() {
  return unstable_cache(
    async () => fetchGql<any>(Q_HUB_INDEX, undefined, { revalidate: REVALIDATE }),
    cacheKey("hub-index"),
    { revalidate: REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cache a smaller index for service detail related sections */
export async function getCachedServiceRelatedIndex() {
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICE_RELATED_INDEX, undefined, { revalidate: REVALIDATE }),
    cacheKey("service-related-index"),
    { revalidate: REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

export async function getCachedServicesList() {
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICES_LIST, undefined, { revalidate: REVALIDATE }),
    cacheKey("services"),
    { revalidate: REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Lightweight cached slugs for validation & static params (no content) */
export async function getCachedServiceSlugs() {
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICE_SLUGS, undefined, { revalidate: REVALIDATE }),
    cacheKey("service-slugs"),
    { revalidate: REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

/** Cached fetch for a single service by slug (avoids downloading the full list) */
export async function getCachedServiceBySlug(slug: string) {
  const s = String(slug || "").trim().toLowerCase();
  return unstable_cache(
    async () => fetchGql<any>(Q_SERVICE_BY_SLUG, { slug: s }, { revalidate: REVALIDATE }),
    cacheKey("service-by-slug", s),
    { revalidate: REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

export async function getCachedLocationpagesList() {
  return unstable_cache(
    async () => fetchGql<any>(Q_LOCATIONPAGES_LIST, undefined, { revalidate: REVALIDATE }),
    cacheKey("locationpages"),
    { revalidate: REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}

export async function getCachedPricemodelsList() {
  return unstable_cache(
    async () => fetchGql<any>(Q_PRICEMODELS_LIST, undefined, { revalidate: REVALIDATE }),
    cacheKey("pricemodels"),
    { revalidate: REVALIDATE, tags: [CACHE_TAG, "wp"] }
  )();
}
