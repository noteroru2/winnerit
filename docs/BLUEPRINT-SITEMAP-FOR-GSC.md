# Blueprint: ปรับ Sitemap ให้ Google Search Console ดึงได้

เอกสารนี้สรุปวิธีแก้ปัญหา **"ดึงข้อมูลไม่ได้" (Could not fetch sitemap)** ใน GSC เพื่อนำไปใช้ในโปรเจกต์อื่น (เช่น webuy hub)

---

## 1. ปัญหา

- ส่ง `https://โดเมน/sitemap.xml` ใน Google Search Console แล้ว
- GSC แสดงสถานะ **"ดึงข้อมูลไม่ได้"** / ประเภท **"ไม่รู้จัก"**
- สาเหตุที่พบบ่อย: ใช้ Route Handler (`app/sitemap.xml/route.ts`) ซึ่ง crawler บางตัวหรือบางโฮสต์ handle ไม่สม่ำเสมอ

---

## 2. หลักการแก้

ใช้ **Next.js Metadata Sitemap** แทน Route Handler:

- ใช้ไฟล์ **`app/sitemap.ts`** (หรือ `sitemap.js`) ตาม [Next.js convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- Next.js จะ serve `/sitemap.xml` ให้เอง และ crawler เข้าถึงได้เสถียรกว่า
- Sitemap เป็น **ไฟล์เดียว** รวมทุก URL (หรือจะแยกหลายไฟล์ตาม `generateSitemaps` ก็ได้)

---

## 3. Checklist การปรับในโปรเจกต์ (เช่น webuy hub)

### 3.1 สร้างหรือมี logic สร้างรายการ sitemap อยู่แล้ว

- โปรเจกต์ต้องมีฟังก์ชันที่คืน **รายการ URL** สำหรับ sitemap (เช่น จาก WP, จาก static routes)
- รูปแบบที่ Next ใช้: `Array<{ url: string; lastModified?: Date | string; changeFrequency?; priority? }>`

ถ้ายังไม่มี:
- สร้างโมดูลอย่าง `lib/sitemap-build.ts` (หรือเทียบเท่า) ที่มีอย่างน้อย:
  - ฟังก์ชันคืน **หน้า static** (/, /about, /terms ฯลฯ)
  - ถ้ามี CMS: ฟังก์ชันดึง slug/path จาก API แล้วรวมเป็นรายการ URL
  - ใช้ **base URL จาก env** (เช่น `SITE_URL` หรือ `NEXT_PUBLIC_SITE_URL`) ไม่ hardcode domain

### 3.2 สร้าง `app/sitemap.ts`

- **ลบ** Route Handler เก่าที่ serve `/sitemap.xml` (ถ้ามี):
  - เช่น ลบโฟลเดอร์ `app/sitemap.xml/` หรือไฟล์ `app/sitemap.xml/route.ts`
- **สร้าง** ไฟล์ `app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
// ปรับ import ตามโครงสร้างโปรเจกต์
import { getSitemapEntries, getPagesEntries } from "@/lib/sitemap-build";

export const revalidate = 86400;

function toMetadataEntry(e: {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
}): MetadataRoute.Sitemap[number] {
  return {
    url: e.url,
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: e.priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await getSitemapEntries(); // รวม static + dynamic จาก CMS
    return entries.map(toMetadataEntry);
  } catch {
    const fallback = getPagesEntries(); // เฉพาะหน้า static
    return fallback.map(toMetadataEntry);
  }
}
```

- ปรับชื่อฟังก์ชัน/โมดูล (`getSitemapEntries`, `getPagesEntries`) ให้ตรงกับโปรเจกต์
- ต้องไม่ throw ตอน error — ใช้ fallback เพื่อให้ GSC ได้ XML เสมอ (อย่างน้อยหน้า static)

### 3.3 Middleware — ไม่ให้รันกับ sitemap / robots

- ใน `middleware.ts` ใช้ **matcher** ให้ **ไม่** match path ของ sitemap และ robots:

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap[^/]*\\.xml).*)",
  ],
};
```

- เพื่อให้ request ไปที่ `/sitemap.xml` (และ `robots.txt`) ไม่ผ่าน logic ใน middleware

### 3.4 Header สำหรับ `/sitemap.xml` (ถ้าต้องการ)

- ใน `next.config.js` (หรือ `next.config.mjs`) เพิ่ม header ให้ path `/sitemap.xml`:

```js
async headers() {
  return [
    {
      source: '/sitemap.xml',
      headers: [
        { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
      ],
    },
    // ... headers อื่นของโปรเจกต์
  ];
}
```

### 3.5 ตั้งค่า base URL (SITE_URL)

- **robots.txt** และ **ทุก URL ใน sitemap** ต้องใช้โดเมนจริง (เช่น `https://webuy.in.th`)
- ในโปรเจกต์ที่ใช้:
  - ตั้ง **`SITE_URL`** (หรือ `NEXT_PUBLIC_SITE_URL`) = URL จริงของเว็บ
- ใน `lib/sitemap-build.ts` (หรือที่รวมรายการ sitemap) ใช้ฟังก์ชันอย่าง `siteUrl()` ที่อ่านจาก env นี้ ไม่ hardcode domain

### 3.6 robots.ts

- ให้ชี้ sitemap ไปที่โดเมนเดียวกัน (จาก env):

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/wp"; // หรือโมดูลที่อ่าน SITE_URL

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl().replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

---

## 4. โครงสร้างไฟล์ที่เกี่ยวข้อง (อ้างอิง)

```
app/
  sitemap.ts              ← สร้างใหม่ (metadata sitemap)
  robots.ts               ← มี sitemap: `${base}/sitemap.xml`
  sitemap.xml/
    route.ts              ← ลบ (ถ้ามี) เพื่อไม่ชนกับ sitemap.ts

lib/
  sitemap-build.ts        ← getSitemapEntries(), getPagesEntries(), siteUrl()
  wp.ts                   ← siteUrl() อ่าน SITE_URL

middleware.ts             ← matcher ไม่รวม sitemap*.xml, robots.txt
next.config.js            ← headers สำหรับ /sitemap.xml (optional)
```

---

## 5. การทดสอบหลัง deploy

1. เปิด `https://โดเมนจริง/sitemap.xml` ในเบราว์เซอร์ → ต้องได้ XML มี `<url>` หลายรายการ ไม่ใช่ 404
2. ใน Google Search Console → Sitemaps → ส่ง `sitemap.xml` (หรือลบเก่าแล้วส่งใหม่)
3. ถ้ายังแสดง "ดึงข้อมูลไม่ได้": ตรวจ SITE_URL, ว่าโดเมนชี้มาที่ deployment ที่ deploy ล่าสุด และลองส่งเป็น `https://โดเมน/sitemap.xml/` (มี slash ท้าย)

---

## 6. สรุปสั้น ๆ สำหรับ copy ไปโปรเจกต์ใหม่

- ใช้ **`app/sitemap.ts`** export default async function คืน `MetadataRoute.Sitemap`
- **ลบ** `app/sitemap.xml/route.ts` (หรือ route ที่ serve sitemap แบบเก่า)
- Middleware **matcher ไม่รวม** `sitemap[^/]*\.xml` และ `robots.txt`
- ตั้ง **SITE_URL** = โดเมนจริง และใช้ค่านี้ใน robots + ทุก URL ใน sitemap
- มี **fallback** ตอนดึงข้อมูลล้ม (อย่างน้อยคืนหน้า static) เพื่อไม่ให้ GSC ได้ 500

เสร็จแล้วนำ blueprint นี้ไปใช้กับ webuy hub ได้เลย โดยปรับชื่อโมดูล/ฟังก์ชันและโครงสร้างให้ตรงกับโปรเจกต์นั้น
