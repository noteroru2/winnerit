/**
 * คีย์ site จาก environment — ใช้กรองเนื้อหาจาก WordPress ให้ตรงกับเว็บที่ deploy
 * ตั้งใน Vercel: SITE_KEY=winnerit (หรือ webuy สำหรับเว็บ webuy)
 * ใน WP แต่ละโพสต์กำหนด field "site" = winnerit / webuy ถ้าว่างจะโชว์ทุก site
 */
/** อ่านจาก SITE_KEY หรือ NEXT_PUBLIC_SITE_KEY (ใช้ตอน build ได้) — ตั้งใน Vercel ให้ตรงกับ site */
export function getSiteKey(): string {
  const key = process.env.SITE_KEY ?? process.env.NEXT_PUBLIC_SITE_KEY;
  const s = String(key ?? "webuy").trim().toLowerCase();
  return s || "webuy";
}

/** เช็คว่าโพสต์นี้ใช้กับเว็บปัจจุบันหรือไม่ (site ว่าง = ใช้ได้ทุกเว็บ) */
export function isSiteMatch(siteValue: unknown): boolean {
  const s = String(siteValue ?? "").trim().toLowerCase();
  const key = getSiteKey();
  return !s || s === key;
}
