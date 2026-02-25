# เชื่อมโปรเจกต์ Winner IT เข้า Vercel

## วิธีที่ 1: เชื่อมผ่าน Vercel Dashboard (แนะนำ)

1. **เปิด Vercel**
   - ไปที่ **https://vercel.com**
   - ล็อกอินด้วยบัญชี GitHub (หรืออีเมล)

2. **เพิ่มโปรเจกต์จาก GitHub**
   - คลิก **Add New…** → **Project**
   - ในส่วน **Import Git Repository** เลือก **GitHub**
   - ถ้ายังไม่เคยเชื่อม Vercel กับ GitHub จะมีปุ่ม **Configure GitHub App** หรือ **Grant Access** ให้กดอนุญาตแล้วเลือกให้ Vercel เห็น repo

3. **เลือก Repo**
   - เลือก **noteroru2/winnerit**
   - คลิก **Import**

4. **ตั้งค่าโปรเจกต์**
   - **Framework Preset:** Next.js (Vercel ตรวจจับได้อัตโนมัติ)
   - **Root Directory:** ค่าว่าง (ใช้ทั้ง repo)
   - **Build Command:** `next build` (ค่าเริ่มต้น)
   - **Output Directory:** `.next` (ค่าเริ่มต้น)

5. **Environment Variables (ถ้ามี WordPress/CMS)**
   - กด **Environment Variables** แล้วเพิ่มตามไฟล์ `VERCEL-ENV-SETUP.md` เช่น:
     - `WPGRAPHQL_ENDPOINT` = URL ของ GraphQL
     - `SITE_URL` = URL เว็บหลัง deploy (เช่น `https://winnerit.vercel.app`)
     - `SITE_KEY` ฯลฯ ตามที่โปรเจกต์ใช้

6. **Deploy**
   - กด **Deploy**
   - รอ build จบ จะได้ URL เช่น `https://winnerit-xxx.vercel.app`

หลังเชื่อมแล้ว ทุกครั้งที่ push ขึ้น branch หลัก (เช่น `master`) Vercel จะ build และ deploy ให้อัตโนมัติ (ถ้าเปิด Auto-Deploy ไว้)

---

## วิธีที่ 2: ใช้ Vercel CLI

```bash
# ติดตั้งและล็อกอิน (รันครั้งเดียว)
npx vercel login

# ลิงก์โปรเจกต์กับโฟลเดอร์ปัจจุบัน
npx vercel link

# Deploy (Production)
npx vercel --prod
```

คำสั่ง `vercel link` จะถามว่าใช้ทีม/องค์กรไหน และสร้างหรือเลือกโปรเจกต์ใน Vercel ให้เชื่อมกับโฟลเดอร์นี้ จากนั้นใช้ `vercel --prod` เพื่อ deploy ขึ้น production

---

## หมายเหตุ

- Repo บน GitHub: **https://github.com/noteroru2/winnerit**
- ถ้า build แล้วหน้า 404 หรือดึงข้อมูลไม่ขึ้น ให้ตรวจ Environment Variables ตาม `VERCEL-ENV-SETUP.md`
