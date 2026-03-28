/**
 * Request-scoped dedupe สำหรับข้อมูล WordPress — แบบ webuy-hub-v2
 */
import { cache } from "react";
import { fetchGql } from "@/lib/wp";
import { getCachedHubIndex, getCachedLocationpagesList, getCachedPricemodelsList } from "@/lib/wp-cache";
import {
  Q_SERVICE_BY_SLUG,
  Q_LOCATION_BY_SLUG,
  Q_LOCATION_SLUGS,
  Q_DEVICECATEGORY_BY_SLUG,
  Q_PRICE_BY_SLUG,
  Q_SITE_SETTINGS,
} from "@/lib/queries";

const REVALIDATE = 7200;

function isPublish(status: any) {
  return String(status || "").toLowerCase() === "publish";
}

export const getHubIndex = cache(async () => {
  try {
    return await getCachedHubIndex();
  } catch {
    return null;
  }
});

export const getServiceBySlug = cache(async (slug: string) => {
  const s = String(slug ?? "").trim();
  if (!s) return null;
  const res = await fetchGql<{ services?: { nodes?: any[] } }>(
    Q_SERVICE_BY_SLUG,
    { slug: s },
    { revalidate: REVALIDATE }
  );
  const node = res?.services?.nodes?.[0];
  return node && isPublish(node?.status) ? node : null;
});

export const getLocationBySlug = cache(async (slug: string) => {
  const s = String(slug ?? "").trim();
  if (!s) return null;

  async function oneBySlug(slugToTry: string) {
    const one = await fetchGql<any>(Q_LOCATION_BY_SLUG, { slug: slugToTry }, { revalidate: 86400 });
    const node = (one?.locationpages?.nodes ?? [])[0];
    return node && isPublish(node?.status) ? node : null;
  }

  try {
    const direct = await oneBySlug(s);
    if (direct) return direct;
  } catch {
    /* ignore */
  }

  try {
    const slugData = await fetchGql<any>(Q_LOCATION_SLUGS, undefined, { revalidate: REVALIDATE });
    const slugNode = (slugData?.locationpages?.nodes ?? []).find(
      (n: any) => String(n?.slug || "").toLowerCase() === s.toLowerCase() && isPublish(n?.status)
    );
    if (slugNode) {
      const resolved = String(slugNode.slug ?? s).trim();
      try {
        const full = await oneBySlug(resolved);
        if (full) return full;
      } catch {
        /* ignore */
      }
      return {
        slug: resolved,
        title:
          slugNode.title ??
          s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
        content: "",
        status: "publish",
        province: slugNode.province ?? "",
        district: slugNode.district ?? null,
        site: slugNode.site ?? "",
        devicecategories: { nodes: [] as any[] },
      };
    }
  } catch {
    /* ignore */
  }

  try {
    const data = await getCachedLocationpagesList();
    const loc = (data?.locationpages?.nodes ?? []).find(
      (n: any) => String(n?.slug || "").toLowerCase() === s.toLowerCase()
    );
    if (loc && isPublish(loc?.status)) return loc;
  } catch {
    /* ignore */
  }
  return null;
});

export const getCategoryBySlug = cache(async (slug: string) => {
  const s = String(slug ?? "").trim();
  if (!s) return null;
  const index = await getHubIndex();
  const term = (index?.devicecategories?.nodes ?? []).find(
    (n: any) => String(n?.slug || "").toLowerCase() === s.toLowerCase()
  );
  if (term?.slug) return term;
  const bySlug = await fetchGql<{ devicecategory?: any }>(
    Q_DEVICECATEGORY_BY_SLUG,
    { slug: s },
    { revalidate: REVALIDATE }
  );
  return bySlug?.devicecategory ?? null;
});

export const getPriceBySlug = cache(async (slug: string) => {
  const s = String(slug ?? "").trim();
  if (!s) return null;
  const data = await getCachedPricemodelsList();
  const p = (data?.pricemodels?.nodes ?? []).find(
    (n: any) => String(n?.slug || "").toLowerCase() === s.toLowerCase()
  );
  if (p && isPublish(p?.status)) return p;
  const bySlug = await fetchGql<{ pricemodels?: { nodes?: any[] } }>(
    Q_PRICE_BY_SLUG,
    { slug: s },
    { revalidate: REVALIDATE }
  );
  const node = bySlug?.pricemodels?.nodes?.[0];
  return node && isPublish(node?.status) ? node : null;
});

export const getSiteSettings = cache(async () => {
  try {
    const data = await fetchGql<any>(Q_SITE_SETTINGS, undefined, { revalidate: REVALIDATE });
    return data?.page ?? {};
  } catch {
    return {};
  }
});
