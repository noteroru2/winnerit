# Sitemap สำหรับ Google Search Console

## การทำงานในโปรเจกต์

- ใช้ **Next.js Metadata convention**: ไฟล์ `src/app/sitemap.ts` สร้าง `/sitemap.xml` ให้อัตโนมัติ (Google ดึงได้เสถียร)
- Sitemap รวมทุก URL: หน้า static + บริการ/พื้นที่/หมวด/ราคาจาก WordPress (กรองตาม `SITE_KEY`)
- ถ้า WordPress ล่มหรือ timeout จะ fallback เป็นเฉพาะหน้า static

## ถ้า Google แสดง "ดึงข้อมูลไม่ได้"

1. **ตั้งค่าโดเมนใน Vercel**
   - ไปที่ Vercel → โปรเจกต์ → Settings → Domains
   - ให้แน่ใจว่าโดเมน (เช่น `winnerit.in.th`) ชี้มาที่ deployment นี้

2. **ตั้งค่า Environment**
   - ตั้ง **`SITE_URL`** = URL จริงของเว็บ เช่น `https://winnerit.in.th`
   - ค่านี้ใช้ใน `robots.txt` และใน URL ทั้งหมดใน sitemap — ถ้าผิด Google จะดึงหรือติดตามลิงก์ผิดโดเมน

3. **ทดสอบหลัง Redeploy**
   - เปิด `https://โดเมนของคุณ/sitemap.xml` ในเบราว์เซอร์ ต้องได้ไฟล์ XML (รายการ `<url>`) ไม่ใช่ 404
   - ใน Google Search Console → Sitemaps → ส่ง `sitemap.xml` ใหม่ (หรือลบแล้วส่งใหม่)

4. **ถ้ายังไม่ได้**
   - ตรวจว่าไม่มี firewall/CDN บล็อก Googlebot
   - ลองส่งด้วย URL มี slash ท้าย: `https://winnerit.in.th/sitemap.xml/`
