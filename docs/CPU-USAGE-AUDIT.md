# รายงานตรวจสอบ CPU / Middleware / SSR–ISR (Vercel)

## สรุปผลการตรวจสอบ

### 1. Middleware — **น้ำหนัก: ต่ำมาก**

- ไฟล์: `src/middleware.ts`
- ทำแค่ `NextResponse.next()` ไม่มี logic เพิ่ม
- Matcher ไม่รันกับ `_next`, `favicon`, `robots`, `sitemap*.xml`
- **สรุป:** ไม่น่าจะเป็นสาเหตุ CPU 80%

---

### 2. SSR / ISR — **น้ำหนัก: ปานกลางถึงสูง (ตาม pattern การเข้า)**

| ส่วน | การตั้งค่า | ผลต่อ CPU |
|------|------------|-----------|
| หน้าหลัก `/` | `revalidate = 86400` (24 ชม.) | หลัง cache แล้วเบา |
| `/services/[slug]` | ISR 24 ชม., `generateStaticParams = []` | **ทุก slug = on-demand ครั้งแรก** → โหลด WP + render |
| `/categories/[slug]` | เหมือนกัน | ครั้งแรกเข้าแต่ละ slug แพง |
| `/locations/[province]` | เหมือนกัน | **แพงสุด:** หลายขั้น fallback (ดูด้านล่าง) |
| `/prices/[slug]` | เหมือนกัน | ครั้งแรกเข้าแต่ละ slug แพง |

- ทุก dynamic route ใช้ **ISR (revalidate 86400 หรือ 3600)** ไม่ใช่ full SSR ทุก request
- แต่เพราะ **ไม่มีการ pre-render ตอน build** (`generateStaticParams` คืน `[]`) การเข้าแต่ละ URL ครั้งแรก = รัน server + ดึง WP + render
- **generateMetadata** รันแยกจาก **Page** → บาง route ดึงข้อมูลซ้ำ (metadata 1 ชุด, page อีกชุด) แม้ Next จะ dedupe บาง call

---

### 3. หน้าที่กิน CPU มากที่สุด

#### 3.1 หน้า Location `/locations/[province]`

ต่อ 1 request (รวม metadata + page) มีโอกาสได้ถึง:

- `fetchGql(Q_LOCATION_BY_SLUG)` — ใน metadata และใน page (อาจ dedupe ได้)
- `getCachedLocationpagesList()` — ถ้าไม่เจอจาก BY_SLUG
- `fetchGql(Q_LOCATION_SLUGS)` — fallback อีกรอบ
- `fetchGql(Q_HUB_INDEX)` — สำหรับ related / index
- `fetchGql(Q_SITE_SETTINGS)` — สำหรับ LocalBusiness JSON-LD

รวม **ประมาณ 4–6 ครั้ง** ต่อการโหลด 1 หน้า location (ในกรณีที่ cache ยังไม่เต็ม)

#### 3.2 หน้า Category `/categories/[slug]`

- Metadata: `Q_HUB_INDEX` + อาจได้ `Q_DEVICECATEGORY_BY_SLUG`
- Page: `Q_HUB_INDEX` อีก + fallback `getCachedHubIndex()` + `Q_DEVICECATEGORY_BY_SLUG` ถ้า slug ไม่อยู่ใน index

→ โอกาสดึง **Q_HUB_INDEX หลายครั้ง** และดึง by_slug แยก

#### 3.3 Open Graph Images (opengraph-image.tsx) — **ตัวกิน CPU มาก**

- มีหลาย route: `/`, `/services/[slug]`, `/categories/[slug]`, `/locations/[province]`, `/locations/[province]/[district]`, `/prices/[slug]`
- แต่ละครั้งที่ bot (Facebook, Twitter, LINE, Google) หรือแชร์ลิงก์ขอ OG image → Next สร้าง **ImageResponse** (ใช้ Satori + render เป็น PNG)
- **ไม่มี `revalidate` ใน opengraph-image** → ถ้า Next ไม่ cache ให้ จะถูกสร้างใหม่ทุก request
- การ render รูป 1200×630 ด้วย Satori ค่อนข้างใช้ CPU

**สรุป:** การแชร์ลิงก์หรือ crawl จำนวนมากจะยิงทั้ง HTML และ OG image → จำนวน request สูง และ OG image เป็นงาน CPU แบบหนัก

---

### 4. Sitemap

- `sitemap.xml` และ sitemap ย่อยใช้ `revalidate = 86400` และ `runtime = "edge"`
- sitemap ย่อยดึงข้อมูลจาก WP ผ่าน `sitemap-build` (fetchGql / cache)
- โดยรวมมี cache ตาม revalidate แล้ว แต่การเรียก sitemap บ่อย (เช่น crawl หลายครั้งต่อวัน) ก็ยังมี cost

---

### 5. API Revalidate

- `POST /api/revalidate` ใช้ `revalidateTag('wp')` → ล้าง cache ที่ tag `"wp"`
- หลัง webhook จาก WP → request ถัดไปที่ไปหน้าที่ใช้ cache นี้จะต้องดึง WP ใหม่ + render ใหม่
- ถ้ามีการ revalidate บ่อย หรือ revalidate แล้วมี traffic เข้าหน้าเหล่านั้นพร้อมกัน → จะเห็น CPU พีค

---

## สาเหตุที่อาจทำให้ CPU บน Vercel ไปที่ ~80%

1. **OG Image ไม่มี revalidate** → สร้างใหม่บ่อยเมื่อมีแชร์/ crawl
2. **Dynamic routes ไม่ได้ pre-render** → ครั้งแรกของแต่ละ URL = เต็ม cost (WP + render)
3. **Location page มีหลายขั้น fallback** → หลายครั้งดึง WP ต่อ 1 request
4. **Metadata + Page ดึงข้อมูลซ้ำในบาง route** (โดยเฉพาะ Q_HUB_INDEX, by_slug)
5. **Vercel Free (หรือ plan จำกัด)** มีขีดจำกัด CPU/ความเร็ว → ถ้า request พร้อมกันหรือ cold start เยอะ ตัวเลข CPU จะสูง

---

## แนวทางลด CPU (ที่ทำได้ทันที)

1. **เพิ่ม `revalidate` ให้ opengraph-image ทุกที่ที่รองรับ**  
   → ให้ cache OG image ตามเวลา (เช่น 86400) ลดการ render ซ้ำ

2. **ลดการดึง WP ซ้ำใน location page**  
   → พยายามใช้ “ดึงครั้งเดียวแล้วใช้ทั้ง metadata และ page” (shared data) แทนการ fallback หลายชั้น

3. **เพิ่ม revalidate ให้ route อื่นที่ยังไม่มี**  
   → เช่น route ที่เป็น dynamic แต่ยังไม่ได้ตั้ง revalidate

4. **พิจารณา pre-render บาง slug ตอน build**  
   → ถ้ามีรายการ slug ไม่มาก ส่งจาก `generateStaticParams` จะได้ static/ISR ตั้งแต่ build ลด on-demand ครั้งแรก

5. **ตรวจ Vercel Analytics / Logs**  
   → ดูว่า request ไปที่ path ไหนมาก (/, /services/xxx, /locations/xxx, หรือ request ไปที่ opengraph-image โดยตรง)

---

*อัปเดตหลังตรวจโค้ด: มีนาคม 2025*
