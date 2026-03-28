/**
 * Cached WordPress list fetches — แบบ webuy-hub-v2:
 * unstable_cache + in-flight coalesce + hub แยก 4 คิวรี (skipDelay) ลด WP 500
 */
import { unstable_cache } from "next/cache";
import { fetchGql, isNextjsProductionBuild, wpCacheKeySuffix } from "@/lib/wp";
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
  Q_HUB_SERVICES,
  Q_HUB_LOCATIONPAGES,
  Q_HUB_PRICEMODELS,
  Q_HUB_DEVICECATEGORIES,
  Q_SERVICE_RELATED_INDEX,
  Q_DEVICECATEGORY_BY_SLUG,
  Q_DEVICECATEGORY_SLUGS,
  Q_PRICE_SLUGS,
  Q_SITE_SETTINGS,
} from "@/lib/queries";

const CACHE_TAG = "wp-lists";
const HUB_REVALIDATE = 86400;
const LIST_REVALIDATE = 7200;

function cacheKeyParts(...parts: string[]): string[] {
  const rev = wpCacheKeySuffix();
  const base = [CACHE_TAG, getSiteKey(), ...parts];
  return rev ? [...base, rev] : base;
}

const inFlightMap: Record<string, Promise<unknown> | null> = {
  hub: null,
  locations: null,
  prices: null,
  serviceSlugs: null,
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

function withListCache<T>(key: string[], revalidate: number, fn: () => Promise<T>): Promise<T> {
  if (isNextjsProductionBuild()) {
    return fn();
  }
  return unstable_cache(fn, key, { revalidate, tags: [CACHE_TAG, "wp"] })();
}

const hubGqlOpts = {
  revalidate: HUB_REVALIDATE,
  noDataCache: true,
  skipDelay: true,
} as const;

async function fetchHubMerged(): Promise<any> {
  const [r0, r1, r2, r3] = await Promise.allSettled([
    fetchGql<any>(Q_HUB_SERVICES, undefined, hubGqlOpts),
    fetchGql<any>(Q_HUB_LOCATIONPAGES, undefined, hubGqlOpts),
    fetchGql<any>(Q_HUB_PRICEMODELS, undefined, hubGqlOpts),
    fetchGql<any>(Q_HUB_DEVICECATEGORIES, undefined, hubGqlOpts),
  ]);

  const out: any = {
    services: { nodes: [] as any[] },
    locationpages: { nodes: [] as any[] },
    pricemodels: { nodes: [] as any[] },
    devicecategories: { nodes: [] as any[] },
  };

  if (r0.status === "fulfilled" && r0.value?.services) out.services = r0.value.services;
  if (r1.status === "fulfilled" && r1.value?.locationpages) out.locationpages = r1.value.locationpages;
  if (r2.status === "fulfilled" && r2.value?.pricemodels) out.pricemodels = r2.value.pricemodels;
  if (r3.status === "fulfilled" && r3.value?.devicecategories) out.devicecategories = r3.value.devicecategories;

  const allRejected = [r0, r1, r2, r3].every((r) => r.status === "rejected");
  if (!allRejected) return out;

  return fetchGql<any>(Q_HUB_INDEX, undefined, hubGqlOpts);
}

export async function getCachedHubIndex() {
  return coalesce("hub", () =>
    withListCache(cacheKeyParts("hub-index"), HUB_REVALIDATE, () => fetchHubMerged())
  );
}

export async function getCachedServiceRelatedIndex() {
  return withListCache(cacheKeyParts("service-related-index"), HUB_REVALIDATE, () =>
    fetchGql<any>(Q_SERVICE_RELATED_INDEX, undefined, { revalidate: HUB_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedServicesList() {
  return withListCache(cacheKeyParts("services"), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_SERVICES_LIST, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedServiceSlugs() {
  return coalesce("serviceSlugs", () =>
    withListCache(cacheKeyParts("service-slugs"), LIST_REVALIDATE, () =>
      fetchGql<any>(Q_SERVICE_SLUGS, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
    )
  );
}

export async function getCachedServiceBySlug(slug: string) {
  const s = String(slug || "").trim().toLowerCase();
  return withListCache(cacheKeyParts("service-by-slug", s), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_SERVICE_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedLocationpagesList() {
  return coalesce("locations", () =>
    withListCache(cacheKeyParts("locationpages"), LIST_REVALIDATE, () =>
      fetchGql<any>(Q_LOCATIONPAGES_LIST, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
    )
  );
}

export async function getCachedPricemodelsList() {
  return coalesce("prices", () =>
    withListCache(cacheKeyParts("pricemodels"), LIST_REVALIDATE, () =>
      fetchGql<any>(Q_PRICEMODELS_LIST, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
    )
  );
}

export async function getCachedLocationBySlug(slug: string) {
  const s = String(slug || "").trim().toLowerCase();
  return withListCache(cacheKeyParts("location-by-slug", s), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_LOCATION_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedLocationSlugs() {
  return withListCache(cacheKeyParts("location-slugs"), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_LOCATION_SLUGS, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedCategoryBySlug(slug: string) {
  const s = String(slug || "").trim();
  return withListCache(cacheKeyParts("category-by-slug", s), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_DEVICECATEGORY_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedPriceBySlug(slug: string) {
  const s = String(slug || "").trim().toLowerCase();
  return withListCache(cacheKeyParts("price-by-slug", s), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_PRICE_BY_SLUG, { slug: s }, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedSiteSettings() {
  return withListCache(cacheKeyParts("site-settings"), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_SITE_SETTINGS, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedPriceSlugs() {
  return withListCache(cacheKeyParts("price-slugs"), LIST_REVALIDATE, () =>
    fetchGql<any>(Q_PRICE_SLUGS, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
  );
}

export async function getCachedCategorySlugs() {
  return coalesce("categorySlugs", () =>
    withListCache(cacheKeyParts("category-slugs"), LIST_REVALIDATE, () =>
      fetchGql<any>(Q_DEVICECATEGORY_SLUGS, undefined, { revalidate: LIST_REVALIDATE, noDataCache: true })
    )
  );
}

let lastHubErrorLogAt = 0;

export async function getCachedHubIndexOrEmpty(): Promise<any> {
  try {
    const row = await getCachedHubIndex();
    return row ?? {};
  } catch (e) {
    const now = Date.now();
    if (now - lastHubErrorLogAt > 60_000) {
      lastHubErrorLogAt = now;
      console.error("[wp-cache] getCachedHubIndex failed:", e);
    }
    return {};
  }
}
