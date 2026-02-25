import Link from "next/link";
import Image from "next/image";
import { fetchGql, siteUrl } from "@/lib/wp";
import { Q_HUB_INDEX } from "@/lib/queries";
import { getCategoriesFromHub } from "@/lib/categories";
import { isSiteMatch } from "@/lib/site-key";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { jsonLdHowTo } from "@/lib/jsonld";
import { jsonLdOrganization, jsonLdWebSite } from "@/lib/jsonld-org";
import { BackToTop } from "@/components/BackToTop";
import { EmptyState } from "@/components/EmptyState";
import { BUSINESS_INFO } from "@/lib/constants";

export const metadata: Metadata = pageMetadata({
  title: "รับซื้อโน๊ตบุ๊ค MacBook PC อุปกรณ์ไอที | ราคาสูง นัดรับถึงบ้าน",
  description:
    "รับซื้อโน๊ตบุ๊ค MacBook PC อุปกรณ์ไอที ให้ราคาสูง ประเมินฟรี นัดรับถึงที่ จ่ายเงินสด ทั่วประเทศ | LINE @webuy โทร 064-2579353",
  pathname: "/",
});

export const revalidate = 86400; // 24 ชม. กัน WP ล่มตอน ISR

function isPublish(status: any) {
  return String(status || "").toLowerCase() === "publish";
}

function takePublished(nodes: any[], limit = 8) {
  return (nodes ?? []).filter((x: any) => x?.slug && isPublish(x?.status)).slice(0, limit);
}

export default async function Page() {
  const raw = await fetchGql<any>(Q_HUB_INDEX, undefined, { revalidate });
  const data = raw ?? {};

  const servicesAll = (data.services?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site));
  const locationsAll = (data.locationpages?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site));
  const pricesAll = (data.pricemodels?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site));
  const dataForCategories = {
    ...data,
    devicecategories: {
      nodes: (data.devicecategories?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site)),
    },
  };
  const categories = getCategoriesFromHub(dataForCategories);

  // ✅ internal linking hub (เลือกชุด “ล่าสุด/มีอยู่จริง” ก่อน)
  const topServices = takePublished(servicesAll, 8);
  const topLocations = takePublished(locationsAll, 8);
  const topPrices = takePublished(pricesAll, 8);

  const pageUrl = siteUrl() + "/";
  const howToJson = jsonLdHowTo(pageUrl);
  const orgJson = jsonLdOrganization(data?.page ?? {});
  const websiteJson = jsonLdWebSite();

  return (
    <div>
      <JsonLd json={orgJson} />
      <JsonLd json={websiteJson} />
      <JsonLd json={howToJson} />

      {/* HERO: เต็มความกว้าง กึ่งมืด ศูนย์กลาง */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/90 via-slate-900 to-brand-800/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.25),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            รับซื้ออุปกรณ์ไอทีถึงบ้าน
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto">
            ประเมินไว • นัดรับถึงที่ • จ่ายทันที
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href={BUSINESS_INFO.lineUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white text-brand-600 font-bold px-8 py-4 hover:bg-white/95 transition">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              แชท LINE ประเมินราคาฟรี
            </a>
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 text-white font-semibold px-8 py-4 hover:bg-white/10 transition">
              ดูหมวดสินค้า →
            </Link>
          </div>
          {/* 3 ขั้นตอนสั้น ๆ ใต้ Hero */}
          <div id="how" className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-left max-w-4xl mx-auto scroll-mt-24">
            {[
              { n: "1", t: "ส่งข้อมูล", d: `ส่งรูป + สเปค ทาง LINE ${BUSINESS_INFO.line}` },
              { n: "2", t: "ประเมินราคา", d: "ทีมงานตอบภายใน 5 นาที พร้อมช่วงราคา" },
              { n: "3", t: "นัดรับ/จ่าย", d: "นัดรับถึงที่ จ่ายเงินสดหรือโอนทันที" },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center">{s.n}</span>
                <div>
                  <div className="font-bold text-white">{s.t}</div>
                  <div className="text-sm text-white/70 mt-0.5">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* หมวดสินค้า: แบบ list มีเส้นซ้าย */}
      <section id="categories" className="mx-auto max-w-6xl px-4 py-14 scroll-mt-24">
        <h2 className="text-xl font-bold text-slate-900 mb-2">หมวดสินค้า</h2>
        <p className="text-slate-600 text-sm mb-6">เลือกหมวดที่สนใจเพื่อดูบริการและราคารับซื้อ</p>
        {categories.length ? (
          <ul className="space-y-0 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {categories.map((c) => {
              const icons: Record<string, string> = { notebook: "💻", mobile: "📱", tablet: "📱", computer: "🖥️", accessories: "⌨️", camera: "📷", gaming: "🎮", smartwatch: "⌚" };
              const icon = icons[c.slug] || "📦";
              return (
                <li key={c.slug}>
                  <Link href={`/categories/${c.slug}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition border-l-4 border-l-transparent hover:border-l-brand-500">
                    <span className="text-2xl">{icon}</span>
                    <span className="flex-1 font-semibold text-slate-900">{c.name}</span>
                    {c.count > 0 && <span className="text-xs text-slate-500">{c.count} รายการ</span>}
                    <span className="text-slate-400">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="ยังไม่มีหมวดสินค้า" description="ติดต่อ LINE เพื่อสอบถาม" icon="📦" actionLabel="แชท LINE" actionHref={BUSINESS_INFO.lineUrl} actionExternal />
        )}
      </section>

      {/* บริการ + พื้นที่ + ราคา: 3 คอลัมน์ในบล็อกเดียว */}
      <section className="bg-slate-100 border-y border-slate-200 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6">สำรวจต่อ</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div id="services" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-24">
              <div className="text-lg font-bold text-slate-900 mb-3">บริการ</div>
              {topServices.length ? (
                <ul className="space-y-2">
                  {topServices.slice(0, 5).map((s: any) => (
                    <li key={s.slug}><Link href={`/services/${s.slug}`} className="text-sm text-slate-700 hover:text-brand-600">→ {s.title}</Link></li>
                  ))}
                  <li><Link href="/categories" className="text-sm font-semibold text-brand-600">ดูทั้งหมด →</Link></li>
                </ul>
              ) : (
                <p className="text-sm text-slate-500">กำลังเพิ่มบริการ</p>
              )}
            </div>
            <div id="locations" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-24">
              <div className="text-lg font-bold text-slate-900 mb-3">พื้นที่บริการ</div>
              {topLocations.length ? (
                <ul className="space-y-2">
                  {topLocations.slice(0, 5).map((l: any) => (
                    <li key={l.slug}><Link href={`/locations/${l.slug}`} className="text-sm text-slate-700 hover:text-brand-600">→ {l.title}</Link></li>
                  ))}
                  <li><Link href="/locations" className="text-sm font-semibold text-brand-600">ดูทั้งหมด →</Link></li>
                </ul>
              ) : (
                <p className="text-sm text-slate-500">กำลังขยายพื้นที่</p>
              )}
            </div>
            <div id="prices" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-24">
              <div className="text-lg font-bold text-slate-900 mb-3">รุ่น/ราคา</div>
              {topPrices.length ? (
                <ul className="space-y-2">
                  {topPrices.slice(0, 5).map((p: any) => (
                    <li key={p.slug}>
                      <Link href={`/prices/${p.slug}`} className="text-sm text-slate-700 hover:text-brand-600">
                        → {p.title}
                        {p.price != null && <span className="text-slate-500 ml-1">({Number(p.price).toLocaleString()} บาท)</span>}
                      </Link>
                    </li>
                  ))}
                  <li><Link href="/categories" className="text-sm font-semibold text-brand-600">ดูทั้งหมด →</Link></li>
                </ul>
              ) : (
                <p className="text-sm text-slate-500">กำลังอัปเดตราคา</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* เกี่ยวกับเรา: ข้อความซ้าย รูปขวา */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">เกี่ยวกับ Winner IT</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              เรามีประสบการณ์มากกว่า 5 ปี ในการรับซื้อ-ขายอุปกรณ์ไอที มีร้านจริง ทีมงานจริง ประเมินราคายุติธรรมตามสภาพจริง
            </p>
            <ul className="space-y-2 text-sm text-slate-700 mb-6">
              <li>• ประเมินราคาฟรี ไม่มีค่าใช้จ่าย</li>
              <li>• ทีมงานมืออาชีพ ประสบการณ์ 5+ ปี</li>
              <li>• มีหน้าร้านจริง ตรวจสอบได้</li>
              <li>• รับซื้อทุกสภาพ (ใช้งานได้/ชำรุด)</li>
            </ul>
            <a href={BUSINESS_INFO.lineUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-brand-500 text-white font-semibold px-5 py-2.5 hover:bg-brand-600 transition">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              คุยทาง LINE
            </a>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <Image src="/images/staff-laptop.jpg" alt="ทีมงาน Winner IT" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* รีวิว: แถบเดียว 2 คอลัมน์ */}
      <section className="bg-slate-100 border-y border-slate-200 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6">ลูกค้าพูดถึงเรา</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: "คุณสมชาย ว.", text: "ประเมินราคาไว ได้ราคาดี นัดรับถึงบ้าน จ่ายเงินสดทันที 👍", product: "MacBook Pro M1" },
              { name: "คุณนิดา ส.", text: "บริการดีมาก ทีมงานมืออาชีพ ได้ราคายุติธรรม แนะนำเลยค่ะ 💯", product: "iPhone 13 Pro" },
            ].map((r, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-700 mb-3">"{r.text}"</p>
                <div className="text-xs text-slate-500">{r.name} — {r.product}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-center text-sm text-slate-600">
            <span>⭐ 4.9/5</span>
            <span>👥 500+ ลูกค้า</span>
            <span>✅ จ่ายทันที</span>
            <span>🚀 ตอบ &lt; 5 นาที</span>
          </div>
        </div>
      </section>

      {/* CTA สั้น */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl bg-slate-900 text-white p-8 sm:p-10 text-center">
          <h2 className="text-xl font-bold mb-2">พร้อมประเมินราคา?</h2>
          <p className="text-white/80 text-sm mb-6">ส่งรูป + สเปค ทาง LINE ได้เลย ทีมงานตอบภายใน 5 นาที</p>
          <a href={BUSINESS_INFO.lineUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 text-white font-bold px-6 py-3 hover:bg-brand-600 transition">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            LINE {BUSINESS_INFO.line}
          </a>
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
