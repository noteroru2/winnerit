// src/lib/wp.ts — โครงเดียวกับ webuy-hub-v2 + แยก cache ตาม SITE_KEY
import { unstable_cache } from "next/cache";
import { getSiteKey } from "@/lib/site-key";

const isVercel = process.env.VERCEL === "1";
const isVercelProduction = isVercel && process.env.NODE_ENV === "production";
const TIMEOUT = Number(
  process.env.WP_FETCH_TIMEOUT_MS ||
    (isVercelProduction ? 8000 : 45000)
);
const RETRY = Number(
  process.env.WP_FETCH_RETRY ?? (isVercelProduction ? 0 : 3)
);

const REQUEST_DELAY_MS = Number(
  process.env.WP_REQUEST_DELAY_MS ?? (isVercel ? 200 : 400)
);
let lastRequestTime = 0;
let requestCount = 0;

const DEFAULT_SITE_URL = "https://webuy.in.th";

/** ระหว่าง `next build` — รวมกรณีรันผ่าน npm และบาง CI ที่ตั้ง NEXT_PHASE */
export function isNextjsProductionBuild(): boolean {
  return (
    process.env.npm_lifecycle_event === "build" ||
    process.env.NEXT_PHASE === "phase-production-build"
  );
}

/** ต่อท้าย cache key — ตั้งเลขใหม่เมื่อ deploy เพื่อล้างแคช WP ที่ค้างบน disk (Coolify volume) */
export function wpCacheKeySuffix(): string {
  return String(process.env.WP_CACHE_REVISION ?? "").trim();
}

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    DEFAULT_SITE_URL;
  const trimmed = String(raw).trim().replace(/\/+$/, "") || DEFAULT_SITE_URL;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return DEFAULT_SITE_URL;
    }
    return parsed.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

async function doFetch(body: any, opts?: { skipDelay?: boolean }) {
  if (!opts?.skipDelay) {
    const now = Date.now();
    const elapsed = now - lastRequestTime;

    if (elapsed < REQUEST_DELAY_MS && lastRequestTime > 0) {
      const waitTime = REQUEST_DELAY_MS - elapsed;
      if (process.env.NODE_ENV !== "production") {
        console.log(`⏳ [Rate Limit] Waiting ${waitTime}ms before next request...`);
      }
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  lastRequestTime = Date.now();
  requestCount++;

  const url =
    process.env.WP_GRAPHQL_URL ||
    process.env.WPGRAPHQL_ENDPOINT ||
    "https://cms.webuy.in.th/graphql";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const sendSecret =
    process.env.WEBUY_GQL_SECRET &&
    process.env.WEBUY_GQL_SEND_SECRET !== "0" &&
    process.env.WEBUY_GQL_SEND_SECRET !== "false";
  if (sendSecret) {
    headers["X-WEBUY-SECRET"] = process.env.WEBUY_GQL_SECRET!;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`WPGraphQL ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    if (json.errors?.length) {
      const parts = json.errors.map((e: any) => e?.message || String(e)).filter(Boolean);
      const unique = Array.from(new Set(parts));
      const msg = unique.join("; ") || "GraphQL error";
      throw new Error(`GraphQL: ${msg}`);
    }
    if (process.env.NODE_ENV !== "production" && process.env.WP_LOG_REQUESTS === "1") {
      const size = JSON.stringify(json).length;
      console.log(`[WP #${requestCount}] ${res.status} ${(size / 1024).toFixed(1)}KB`);
    }
    return json.data ?? json;
  } finally {
    clearTimeout(id);
  }
}

/**
 * When true, return {} instead of throwing on fetch failure.
 * - Runtime บน VPS (`next start`): **ปิด** โดยค่าเริ่มต้น — ถ้าเปิด WP_FALLBACK_ON_ERROR=1 จะเห็น log ซ้ำและข้อมูลว่าง
 * - Vercel production / `npm run build` / development: ตาม webuy-hub-v2
 */
const FALLBACK_ON_ERROR = (() => {
  const explicit = process.env.WP_FALLBACK_ON_ERROR;
  if (explicit === "0" || explicit === "false") return false;
  if (explicit === "1" || explicit === "true") return true;
  if (isVercelProduction) return true;
  if (isNextjsProductionBuild()) return true;
  return process.env.NODE_ENV === "development";
})();

function wpGqlCacheKey(query: string, variables?: unknown): string[] {
  const rev = wpCacheKeySuffix();
  const base = ["wp-gql", getSiteKey(), query, JSON.stringify(variables ?? "")];
  return rev ? [base[0], base[1], rev, base[2], base[3]] : base;
}

async function fetchGqlUncached<T>(
  query: string,
  variables?: any,
  opts?: { skipDelay?: boolean }
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= RETRY; i++) {
    try {
      const raw = await doFetch({ query, variables }, { skipDelay: opts?.skipDelay });
      if (raw?.errors?.length) {
        const msg = raw.errors.map((e: any) => e.message || String(e)).join("; ");
        throw new Error(`GraphQL errors: ${msg}`);
      }
      return (raw?.data ?? raw) as T;
    } catch (e) {
      lastErr = e;
      const msg = (e as Error)?.message ?? "";
      if (/returned (500|502|503)/.test(msg)) break;
      if (/^GraphQL:/.test(msg) || /^GraphQL errors:/.test(msg)) break;
    }
  }
  if (FALLBACK_ON_ERROR) {
    console.warn("[wp] Fetch failed, using fallback (WP_FALLBACK_ON_ERROR):", lastErr?.message || lastErr);
    return {} as T;
  }
  throw lastErr;
}

/**
 * ใช้ unstable_cache ตอน runtime เท่านั้น — ตอน build ถ้า WP ล่มได้ {} อย่าเขียนลงแคช
 */
export async function fetchGql<T>(
  query: string,
  variables?: any,
  options?: { revalidate?: number; noDataCache?: boolean; skipDelay?: boolean }
): Promise<T> {
  const revalidate = options?.revalidate ?? 86400;
  const uncachedOpts = { skipDelay: options?.skipDelay };
  if (isNextjsProductionBuild() || options?.noDataCache) {
    return fetchGqlUncached<T>(query, variables, uncachedOpts);
  }
  const cacheKey = wpGqlCacheKey(query, variables);
  const cached = unstable_cache(
    () => fetchGqlUncached<T>(query, variables, uncachedOpts),
    cacheKey,
    { revalidate, tags: ["wp"] }
  );
  return cached();
}

export async function fetchGqlSafe<T>(
  query: string,
  variables?: any,
  options?: { revalidate?: number; noDataCache?: boolean; skipDelay?: boolean }
): Promise<T | null> {
  try {
    return await fetchGql<T>(query, variables, options);
  } catch {
    return null;
  }
}

/** ยิง WP โดยไม่ผ่าน unstable_cache ของ fetchGql — ใช้เมื่อต้องการข้อมูลสด */
export async function fetchGqlLive<T>(query: string, variables?: any, opts?: { skipDelay?: boolean }): Promise<T> {
  return fetchGqlUncached<T>(query, variables, opts);
}

export async function fetchGqlLiveSafe<T>(
  query: string,
  variables?: any,
  opts?: { skipDelay?: boolean }
): Promise<T | null> {
  try {
    return await fetchGqlLive<T>(query, variables, opts);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[wp] fetchGqlLiveSafe failed:", (e as Error)?.message ?? e);
    }
    return null;
  }
}

export function nodeCats(node: any): string[] {
  const nodes = node?.devicecategories?.nodes ?? [];
  const fromNodes = nodes.map((n: any) => String(n?.slug ?? "").trim()).filter(Boolean);
  if (fromNodes.length) return fromNodes;
  const cat = node?.category ? String(node.category).trim() : "";
  return cat ? [cat] : [];
}
