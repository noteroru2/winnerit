# จุดเชื่อมต่อ WordPress (GraphQL) ในโปรเจกต์

เอกสารสรุปทุกส่วนที่ดึงข้อมูลจาก WordPress ผ่าน WPGraphQL และการลด query ซ้ำ

---

## 1. ชั้นข้อมูล (Data layer)

### `src/lib/wp.ts`
- **fetchGql(query, variables?, options?)** — โหลดข้อมูลจริง ส่ง POST ไป WP GraphQL มี rate limit, timeout, retry
- **fetchGqlSafe** — เหมือน fetchGql แต่ return null เมื่อ error
- ใช้ **unstable_cache** ภายใน fetchGql (revalidate ตาม options, tag `"wp"`)
- ตัวแปร env: `WP_GRAPHQL_URL` / `WPGRAPHQL_ENDPOINT`, `WP_FETCH_TIMEOUT_MS`, `WP_FALLBACK_ON_ERROR`, `WEBUY_GQL_SECRET`, `NEXT_PUBLIC_SITE_URL`

### `src/lib/wp-cache.ts`
Cache ด้วย **unstable_cache** (tag `"wp"` + `CACHE_TAG`) — ใช้ทั้ง build และ runtime เพื่อลดการยิง WP ซ้ำ

| ฟังก์ชัน | Query / ใช้ที่ |
|----------|-----------------|
| **getCachedHubIndex()** | Q_HUB_INDEX — หน้าแรก, categories, locations [province], prices [slug] |
| **getCachedServiceRelatedIndex()** | Q_SERVICE_RELATED_INDEX — หน้า services/[slug] (related เท่านั้น) |
| **getCachedServicesList()** | Q_SERVICES_LIST — opengraph (ที่อื่นใช้ bySlug) |
| **getCachedServiceSlugs()** | Q_SERVICE_SLUGS — services/[slug] validate, generateStaticParams, sitemap |
| **getCachedServiceBySlug(slug)** | Q_SERVICE_BY_SLUG — services/[slug], opengraph |
| **getCachedLocationpagesList()** | Q_LOCATIONPAGES_LIST — locations [province] fallback, opengraph |
| **getCachedLocationSlugs()** | Q_LOCATION_SLUGS — locations list, locations [province] fallback, sitemap |
| **getCachedLocationBySlug(slug)** | Q_LOCATION_BY_SLUG — locations [province] metadata + page |
| **getCachedPricemodelsList()** | Q_PRICEMODELS_LIST — prices [slug], opengraph |
| **getCachedPriceSlugs()** | Q_PRICE_SLUGS — sitemap |
| **getCachedPriceBySlug(slug)** | Q_PRICE_BY_SLUG — prices [slug] metadata + page |
| **getCachedCategorySlugs()** | Q_DEVICECATEGORY_SLUGS — sitemap |
| **getCachedCategoryBySlug(slug)** | Q_DEVICECATEGORY_BY_SLUG — categories [slug], opengraph |
| **getCachedSiteSettings()** | Q_SITE_SETTINGS — locations [province] (LocalBusiness JSON-LD) |

---

## 2. หน้าที่ใช้ WP (และลดการยิงซ้ำ)

### หน้าแรก `src/app/page.tsx`
- **getCachedHubIndex()** — ครั้งเดียว (เดิมใช้ fetchGql Q_HUB_INDEX)

### หมวดสินค้า (list) `src/app/categories/page.tsx`
- **getCachedHubIndex()** — ครั้งเดียว

### หมวดสินค้า (detail) `src/app/categories/[slug]/page.tsx`
- **getCategoryData(slug)** = cache(getCategoryPageData) — ใช้ทั้ง generateMetadata และ Page
- ข้างใน: **getCachedHubIndex()** + **getCachedCategoryBySlug(slug)** → ยิง hub + bySlug แค่ชุดเดียวต่อ request

### บริการ `src/app/services/[slug]/page.tsx`
- **getService(slug)** = cache(getServiceOrNull) — ใช้ทั้ง generateMetadata และ Page
- ข้างใน: **getCachedServiceSlugs()** (validate) + **getCachedServiceBySlug(slug)**
- หน้า page: **getCachedServiceRelatedIndex()** (related เท่านั้น)

### พื้นที่บริการ (list) `src/app/locations/page.tsx`
- **getCachedLocationSlugs()** — ครั้งเดียว

### พื้นที่บริการ (detail) `src/app/locations/[province]/page.tsx`
- **getLocation(slug)** = cache(getLocationOrNull) — ใช้ทั้ง generateMetadata และ Page
- ข้างใน: **getCachedLocationBySlug(slug)** → **getCachedLocationpagesList()** → **getCachedLocationSlugs()** (fallback)
- หน้า page: **getCachedHubIndex()** + **getCachedSiteSettings()**

### ราคา `src/app/prices/[slug]/page.tsx`
- **getPrice(slug)** = cache(getPriceOrNull) — ใช้ทั้ง generateMetadata และ Page
- ข้างใน: **getCachedPricemodelsList()** + **getCachedPriceBySlug(slug)**
- หน้า page: **getCachedHubIndex()**

---

## 3. Open Graph / Sitemap

### Opengraph
- **services/[slug]/opengraph-image.tsx** — getCachedServiceBySlug(slug)
- **categories/[slug]/opengraph-image.tsx** — getCachedCategoryBySlug(slug)
- **locations/[province]/opengraph-image.tsx** — getCachedLocationpagesList()
- **prices/[slug]/opengraph-image.tsx** — getCachedPricemodelsList()

### Sitemap `src/lib/sitemap-build.ts`
- **getSitemapEntries()**: getCachedServiceSlugs, getCachedLocationSlugs, getCachedPriceSlugs, getCachedCategorySlugs (แชร์ cache กับหน้าอื่น)
- Route ย่อย (getServicesEntries ฯลฯ): ยังใช้ fetchGql กับ Q_*_PAGINATED ตามเดิม

---

## 4. การลด query ซ้ำที่ทำแล้ว

1. **generateMetadata + Page ใช้ข้อมูลชุดเดียวกัน**
   - แต่ละ dynamic route มี loader เดียว (getService, getLocation, getCategoryData, getPrice) ห่อด้วย **React cache()** ให้ทั้ง metadata และ page เรียก loader เดียว → ยิง WP แค่ครั้งเดียวต่อ request

2. **ใช้ getCached* แทน fetchGql โดยตรง**
   - หน้าแรก, categories (list + detail), locations (list + detail), prices ใช้ getCachedHubIndex / getCachedLocationSlugs / getCached*BySlug เพื่อให้ key เดียวกันและแชร์ cache

3. **Sitemap ใช้ getCached* สำหรับ slug lists**
   - getSitemapEntries ใช้ getCachedServiceSlugs, getCachedLocationSlugs, getCachedPriceSlugs, getCachedCategorySlugs → แชร์ cache กับ static params และหน้าอื่น

4. **Revalidate**
   - API `/api/revalidate` ใช้ **revalidateTag("wp")** เพื่อล้าง cache ที่ tag "wp" (ทุก getCached* ใน wp-cache ใช้ tag นี้)

---

## 5. สรุปจุดเชื่อม WP ทั้งหมด

| ไฟล์/ส่วน | ใช้ WP ผ่าน |
|-----------|-------------|
| wp.ts | fetch ตรงไป WP (มี unstable_cache ใน fetchGql) |
| wp-cache.ts | fetchGql + unstable_cache |
| page.tsx (home) | getCachedHubIndex |
| categories/page.tsx | getCachedHubIndex |
| categories/[slug]/page.tsx | getCachedHubIndex, getCachedCategoryBySlug + React cache() |
| categories/[slug]/opengraph-image.tsx | getCachedCategoryBySlug |
| services/[slug]/page.tsx | getCachedServiceSlugs, getCachedServiceBySlug, getCachedServiceRelatedIndex + React cache() |
| services/[slug]/opengraph-image.tsx | getCachedServiceBySlug |
| locations/page.tsx | getCachedLocationSlugs |
| locations/[province]/page.tsx | getCachedLocationBySlug, getCachedLocationpagesList, getCachedLocationSlugs, getCachedHubIndex, getCachedSiteSettings + React cache() |
| locations/[province]/opengraph-image.tsx | getCachedLocationpagesList |
| prices/[slug]/page.tsx | getCachedPricemodelsList, getCachedPriceBySlug, getCachedHubIndex + React cache() |
| prices/[slug]/opengraph-image.tsx | getCachedPricemodelsList |
| sitemap-build.ts | getCachedServiceSlugs, getCachedLocationSlugs, getCachedPriceSlugs, getCachedCategorySlugs + fetchGql สำหรับ PAGINATED |
| api/revalidate/route.ts | revalidateTag("wp") |
