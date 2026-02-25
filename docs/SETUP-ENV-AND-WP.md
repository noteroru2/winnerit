# ตั้งค่า Environment (Vercel) + WordPress เพื่อให้เว็บแสดงเนื้อหา

หลัง deploy แล้ว ต้องตั้งค่าสองฝั่ง: **Vercel (Environment)** และ **WordPress (CMS)** ถึงจะดึงข้อมูลมาแสดงบน winnerit.vercel.app ได้

---

## ส่วนที่ 1: ตั้งค่า Environment ใน Vercel

### ขั้นตอน

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจกต์ **winnerit** (หรือชื่อที่คุณ deploy)
3. ไปที่ **Settings** → **Environment Variables**

### ตัวแปรที่ต้องมี (ขั้นต่ำ)

| Name | Value | หมายเหตุ |
|------|--------|----------|
| `WPGRAPHQL_ENDPOINT` | `https://โดเมน-WP-ของคุณ/graphql` | **สำคัญที่สุด** ต้องชี้ไปที่ WPGraphQL ของ WordPress จริง (เช่น `https://cms.example.com/graphql`) |
| `SITE_URL` | `https://winnerit.vercel.app` | URL เว็บ frontend จริง (ถ้าใช้ domain อื่น ให้ใส่ domain นั้น) |
| `SITE_KEY` | `winnerit` (สำหรับ Winner IT) หรือ `webuy` (สำหรับ webuy) | **สำคัญ** ใช้กรองเนื้อหาจาก WP — โพสต์ที่ field `site` = ค่านี้ (หรือว่าง) ถึงจะโชว์บนเว็บนี้ |

### ตัวแปรเสริม (ถ้ามี)

| Name | Value | ใช้เมื่อ |
|------|--------|----------|
| `REVALIDATE_SECRET` | สร้างรหัสลับเอง | ต้องการให้ WordPress เรียก API เพื่อ revalidate หลังอัปเดตเนื้อหา |
| `WEBUY_GQL_SECRET` | ค่าที่ตรงกับที่ WP ตั้ง | WordPress เปิดตรวจ header `X-WEBUY-SECRET` |
| `WEBUY_GQL_SEND_SECRET` | `0` | **ใส่เมื่อ** WP ยังไม่ตรวจ secret หรือใส่ secret แล้วเว็บ 404 (จะไม่ส่ง header) |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | ใช้ Google Analytics |

### หลังเพิ่ม/แก้ Environment

- กด **Save**
- ไปที่ **Deployments** → เลือก deployment ล่าสุด → **⋯** → **Redeploy** (แนะนำให้ติ๊ก **Clear Build Cache** ครั้งแรก)

---

## ส่วนที่ 2: ตั้งค่า WordPress ให้ส่งข้อมูลไปเว็บ

เว็บ Winner IT ดึงข้อมูลผ่าน **WPGraphQL** ดังนั้น WordPress ต้องมี:

1. **Plugin WPGraphQL** (และเปิดใช้งาน)
2. **Custom Post Types (CPT)** ที่เปิดใน GraphQL
3. **เนื้อหา (Posts)** สถานะ Publish

### 2.1 ติดตั้ง WPGraphQL

- ติดตั้ง plugin **WPGraphQL**
- เปิดใช้งาน (Activate)

จากนั้นเข้า URL `https://โดเมน-WP-ของคุณ/graphql` ควรเห็น GraphQL (หรือ GraphiQL) ไม่ใช่หน้า 404

### 2.2 Custom Post Types ที่เว็บใช้

เว็บจะ query ชื่อเหล่านี้ใน GraphQL:

| GraphQL ชื่อ | ความหมาย | ใช้ในหน้า |
|--------------|-----------|-----------|
| `services` | บริการรับซื้อ (เช่น รับซื้อโน๊ตบุ๊ค) | หน้าแรก, /services/[slug], หมวดหมู่ |
| `locationpages` | พื้นที่บริการ (จังหวัด/อำเภอ) | หน้าแรก, /locations, /locations/[slug] |
| `pricemodels` | รุ่น/ราคารับซื้อ | หน้าแรก, /prices/[slug], หมวดหมู่ |
| `devicecategories` (taxonomy) | หมวดอุปกรณ์ (notebook, mobile ฯลฯ) | หมวดหมู่, categories/[slug] |

**วิธีสร้าง CPT ใน WordPress ได้สองแบบ:**

- **แบบ Pods (แนะนำถ้าใช้ Pods อยู่แล้ว)**  
  - ใช้สคริปต์ในโปรเจกต์: `create-pods-cpt.php` (รันใน WP ที่มี Pods ติดตั้งแล้ว)  
  - จะได้ post types: service, locationpage, pricemodel และ taxonomy devicecategory ที่เปิดใน GraphQL แล้ว

- **แบบ CPT UI / โค้ดใน theme**  
  - ต้องลงทะเบียน CPT ให้มี `show_in_graphql: true` และชื่อ GraphQL เป็น `Service` / `Services`, `LocationPage` / `LocationPages`, `PriceModel` / `PriceModels` ตามที่เว็บ query  
  - รายละเอียดเพิ่มดูได้จาก `WORDPRESS-SETUP.md` ในโปรเจกต์

### 2.3 ชื่อและฟิลด์ที่เว็บใช้ (สรุป)

- **Service**  
  - ต้องมี: `slug`, `title`, `content` (หรือเทียบเท่า), สถานะ **Publish**  
  - มี field `site` (text) ได้ — ถ้าว่างหรือตรงกับ **SITE_KEY** ที่ตั้งใน Vercel ถึงจะโชว์บนเว็บนั้น (เช่น Winner IT ใช้ `SITE_KEY=winnerit` และใน WP ตั้ง `site = winnerit`)

- **Location Page**  
  - ต้องมี: `slug`, `title`, `content`, สถานะ **Publish**  
  - มี field: `province`, `district`, `site` (ถ้ามี)  
  - ผูก taxonomy **devicecategories** ได้ (ถ้ามี)

- **Price Model**  
  - ต้องมี: `slug`, `title`, สถานะ **Publish**  
  - มี field `price` (ตัวเลข), `site` ได้

- **Device Category (Taxonomy)**  
  - ใช้ผูกกับ Service / Location / Price เพื่อให้หน้า categories และ silo ทำงาน  
  - slug ที่ใช้บ่อย เช่น: notebook, mobile, tablet, computer

### 2.4 สร้างเนื้อหาใน WP

- **หมวดสินค้า (Categories)**  
  - สร้าง terms ใน taxonomy **Device Categories** (เช่น notebook, mobile)  
  - ผูกกับ Services / Location Pages / Price Models ที่ต้องการ

- **บริการ (Services)**  
  - สร้างโพสต์ประเภท Service ใส่ชื่อ (title), slug, เนื้อหา (content)  
  - สถานะ **Published**  
  - กำหนดหมวด (Device Category) ถ้ามี

- **พื้นที่ (Location Pages)**  
  - สร้างโพสต์ประเภท Location Page ใส่ชื่อ (เช่น จังหวัด), slug (เช่น ubon-ratchathani), เนื้อหา  
  - ใส่ province (และ district ถ้ามี)  
  - สถานะ **Published**

- **รุ่น/ราคา (Price Models)**  
  - สร้างโพสต์ประเภท Price Model ใส่ชื่อรุ่น, slug, ราคา (ถ้ามี field)  
  - สถานะ **Published**

เมื่อมีข้อมูลแล้ว เว็บจะดึงไปใช้ที่:

- หน้าแรก: บริการยอดนิยม, พื้นที่บริการ, รุ่น/ราคา, หมวดสินค้า  
- `/categories` → รายการหมวดจาก taxonomy + จำนวนจาก WP  
- `/categories/[slug]` → เนื้อหาหมวดนั้น  
- `/locations` → รายการ location pages  
- `/locations/[slug]` → หน้ารายละเอียดพื้นที่  
- `/services/[slug]`, `/prices/[slug]` → หน้ารายละเอียดจาก WP

### 2.5 CORS / Firewall (ถ้า Vercel ดึง WP ไม่ได้)

- ให้ WordPress อนุญาต request จาก Vercel (origin ของคุณคือ `https://winnerit.vercel.app` หรือ domain ที่ใช้)
- ถ้า WP อยู่หลัง firewall / security plugin ให้ whitelist IP ของ Vercel หรือเปิดรับ request จาก origin ของ frontend
- ลองเรียกจากเครื่องคุณ:  
  `curl -X POST "https://โดเมน-WP-ของคุณ/graphql" -H "Content-Type: application/json" -d "{\"query\":\"{ __typename }\"}"`  
  ควรได้ JSON กลับมา ไม่ใช่ 403/404

---

## เช็คผลหลังตั้งค่า

1. **Build บน Vercel**  
   ดู Build Log ว่ามีการดึงข้อมูลจาก WordPress (เช่นพบ services / locationpages / pricemodels) ไม่ error

2. **ทดสอบหน้าเว็บ**  
   - หน้าแรก: มีบล็อกบริการ, พื้นที่, ราคา, หมวดสินค้า  
   - `/categories` มีรายการหมวด (หรือ empty state ถ้ายังไม่สร้าง terms)  
   - `/locations` มีรายการจังหวัด (หรือ empty state)  
   - คลิกเข้า `/services/xxx`, `/locations/xxx`, `/prices/xxx` ต้องไม่ 404 และเห็นเนื้อหาจาก WP

3. **ถ้ายัง 404 หรือไม่มีข้อมูล**  
   - ตรวจว่า `WPGRAPHQL_ENDPOINT` ชี้ไปที่ URL ที่มี WPGraphQL จริง  
   - ตรวจว่าใน WP มีโพสต์/terms สถานะ Publish และ slug ตรงกับที่เว็บใช้  
   - ถ้า WP บังคับ secret: ใส่ `WEBUY_GQL_SECRET` ใน Vercel ให้ตรงกับ WP หรือตั้ง `WEBUY_GQL_SEND_SECRET=0` ชั่วคราวเพื่อทดสอบ

---

## สรุป Checklist

**Vercel**

- [ ] ตั้ง `WPGRAPHQL_ENDPOINT` = URL GraphQL ของ WordPress
- [ ] ตั้ง `SITE_URL` = URL เว็บ Winner IT (เช่น https://winnerit.vercel.app)
- [ ] ตั้ง `SITE_KEY` ตาม site ที่ใช้ (เช่น `winnerit` สำหรับ Winner IT หรือ `webuy` สำหรับ webuy)
- [ ] Save แล้ว Redeploy (แนะนำ Clear Build Cache ครั้งแรก)

**WordPress**

- [ ] ติดตั้งและเปิดใช้ WPGraphQL
- [ ] สร้าง CPT: Services, Location Pages, Price Models (+ taxonomy Device Categories ถ้าใช้)
- [ ] เปิด CPT ใน GraphQL (ชื่อให้ตรงกับที่เว็บ query)
- [ ] สร้างเนื้อหา (โพสต์/terms) สถานะ Publish
- [ ] ตรวจว่าเรียก `/graphql` จากภายนอกได้ (CORS/firewall)

เมื่อครบสองส่วน เว็บที่ deploy แล้วจะแสดงหน้าจาก WordPress ได้ตามที่ออกแบบไว้
