import Link from "next/link";
import Image from "next/image";
import { siteUrl } from "@/lib/wp";
import { getCachedHubIndex, getCachedCategorySlugs } from "@/lib/wp-cache";
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

/** ไม่ static ตอน build — ถ้า WP 403 ระหว่าง Docker build จะได้ HTML ว่างตลอด (หมวด/บริการไม่ขึ้น) */
export const dynamic = "force-dynamic";

export const revalidate = 86400;

function isPublish(status: any) {
  return String(status || "").toLowerCase() === "publish";
}

function takePublished(nodes: any[], limit = 8) {
  return (nodes ?? []).filter((x: any) => x?.slug && isPublish(x?.status)).slice(0, limit);
}

export default async function Page() {
  const [raw, catRaw] = await Promise.all([getCachedHubIndex(), getCachedCategorySlugs()]);
  const data = raw ?? {};

  const servicesAll = (data.services?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site));
  const locationsAll = (data.locationpages?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site));
  const pricesAll = (data.pricemodels?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site));
  // หมวด: ใช้ query แยก (first: 1000) ไม่ใช้ Hub index ที่จำกัด 300 — กันหมวดขึ้นไม่ครบ
  const categories = getCategoriesFromHub({
    devicecategories: {
      nodes: (catRaw?.devicecategories?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site)),
    },
  });

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

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-stone-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(249,115,22,0.08),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 mb-6">
            ประเมินราคาฟรี &middot; ตอบภายใน 5 นาที
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            รับซื้ออุปกรณ์ไอที<br className="hidden sm:block" />ถึงบ้านคุณ
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            ส่งรูปมาทาง LINE เราประเมินราคาให้ทันที นัดรับถึงที่ จ่ายเงินสดหรือโอน ไม่มีค่าใช้จ่าย
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={BUSINESS_INFO.lineUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary text-base px-7 py-3.5 shadow-md hover:shadow-lg"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              แชท LINE ประเมินราคาฟรี
            </a>
            <Link href="/categories" className="btn btn-ghost text-base px-7 py-3.5">
              ดูหมวดสินค้า
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 3 ขั้นตอน ===== */}
      <section id="how" className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
            {[
              { icon: "1", t: "ส่งข้อมูล", d: `ส่งรูป + สเปค ทาง LINE ${BUSINESS_INFO.line}` },
              { icon: "2", t: "ประเมินราคา", d: "ทีมงานตอบภายใน 5 นาที พร้อมช่วงราคา" },
              { icon: "3", t: "นัดรับ & จ่าย", d: "นัดรับถึงที่ จ่ายเงินสดหรือโอนทันที" },
            ].map((s) => (
              <div key={s.icon} className="flex gap-4 items-start">
                <span className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-sm font-bold border border-brand-100">
                  {s.icon}
                </span>
                <div>
                  <div className="font-semibold text-slate-900">{s.t}</div>
                  <div className="text-sm text-slate-500 mt-0.5 leading-relaxed">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== หมวดสินค้า ===== */}
      <section id="categories" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 scroll-mt-24">
        <div className="mb-8">
          <h2 className="h2">หมวดสินค้า</h2>
          <p className="lead mt-1">เลือกหมวดที่สนใจ เพื่อดูบริการและราคารับซื้อ</p>
        </div>
        {categories.length ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const icons: Record<string, string> = { notebook: "💻", mobile: "📱", tablet: "📱", computer: "🖥️", accessories: "⌨️", camera: "📷", gaming: "🎮", smartwatch: "⌚" };
              const icon = icons[c.slug] || "📦";
              return (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="group flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 transition-all hover:border-brand-200 hover:shadow-soft"
                >
                  <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-stone-50 text-lg sm:text-xl group-hover:bg-brand-50 transition-colors">
                    {icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">{c.name}</div>
                    {c.count > 0 && <div className="text-xs text-slate-400 mt-0.5">{c.count} รายการ</div>}
                  </div>
                  <svg className="h-4 w-4 text-slate-300 group-hover:text-brand-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState title="ยังไม่มีหมวดสินค้า" description="ติดต่อ LINE เพื่อสอบถาม" icon="📦" actionLabel="แชท LINE" actionHref={BUSINESS_INFO.lineUrl} actionExternal />
        )}
      </section>

      {/* ===== สำรวจต่อ (บริการ / พื้นที่ / ราคา) ===== */}
      <section className="border-y border-slate-100 bg-stone-50/50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="h2 mb-8">สำรวจต่อ</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {/* บริการ */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-sm">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </span>
                <span className="font-semibold text-slate-900">บริการ</span>
              </div>
              {topServices.length ? (
                <ul className="space-y-2">
                  {topServices.slice(0, 5).map((s: any) => (
                    <li key={s.slug}>
                      <Link href={`/services/${s.slug}`} className="text-sm text-slate-500 hover:text-brand-600 transition-colors">{s.title}</Link>
                    </li>
                  ))}
                  <li className="pt-1"><Link href="/categories" className="text-sm font-semibold text-brand-600 hover:text-brand-700">ดูทั้งหมด &rarr;</Link></li>
                </ul>
              ) : (
                <p className="text-sm text-slate-400">กำลังเพิ่มบริการ</p>
              )}
            </div>

            {/* พื้นที่ */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500 text-sm">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <span className="font-semibold text-slate-900">พื้นที่บริการ</span>
              </div>
              {topLocations.length ? (
                <ul className="space-y-2">
                  {topLocations.slice(0, 5).map((l: any) => (
                    <li key={l.slug}>
                      <Link href={`/locations/${l.slug}`} className="text-sm text-slate-500 hover:text-brand-600 transition-colors">{l.title}</Link>
                    </li>
                  ))}
                  <li className="pt-1"><Link href="/locations" className="text-sm font-semibold text-brand-600 hover:text-brand-700">ดูทั้งหมด &rarr;</Link></li>
                </ul>
              ) : (
                <p className="text-sm text-slate-400">กำลังขยายพื้นที่</p>
              )}
            </div>

            {/* รุ่น/ราคา */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 text-sm">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span className="font-semibold text-slate-900">รุ่น/ราคา</span>
              </div>
              {topPrices.length ? (
                <ul className="space-y-2">
                  {topPrices.slice(0, 5).map((p: any) => (
                    <li key={p.slug}>
                      <Link href={`/prices/${p.slug}`} className="text-sm text-slate-500 hover:text-brand-600 transition-colors">
                        {p.title}
                        {p.price != null && <span className="text-slate-400 ml-1">({Number(p.price).toLocaleString()}฿)</span>}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-1"><Link href="/categories" className="text-sm font-semibold text-brand-600 hover:text-brand-700">ดูทั้งหมด &rarr;</Link></li>
                </ul>
              ) : (
                <p className="text-sm text-slate-400">กำลังอัปเดตราคา</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== เกี่ยวกับเรา ===== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <h2 className="h2 mb-3">เกี่ยวกับ Winner IT</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
              เรามีประสบการณ์มากกว่า 5 ปี ในการรับซื้อ-ขายอุปกรณ์ไอที มีร้านจริง ทีมงานจริง ประเมินราคายุติธรรมตามสภาพจริง
            </p>
            <ul className="space-y-3 text-sm text-slate-600 mb-6">
              {[
                "ประเมินราคาฟรี ไม่มีค่าใช้จ่าย",
                "ทีมงานมืออาชีพ ประสบการณ์ 5+ ปี",
                "มีหน้าร้านจริง ตรวจสอบได้",
                "รับซื้อทุกสภาพ (ใช้งานได้/ชำรุด)",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <svg className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <a href={BUSINESS_INFO.lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              คุยทาง LINE
            </a>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 border border-slate-200/80">
            <Image src="/images/staff-laptop.jpg" alt="ทีมงาน Winner IT" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* ===== รีวิว ===== */}
      <section className="border-y border-slate-100 bg-stone-50/50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="h2 mb-8">ลูกค้าพูดถึงเรา</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { name: "คุณสมชาย ว.", text: "ประเมินราคาไว ได้ราคาดี นัดรับถึงบ้าน จ่ายเงินสดทันที", product: "MacBook Pro M1" },
              { name: "คุณนิดา ส.", text: "บริการดีมาก ทีมงานมืออาชีพ ได้ราคายุติธรรม แนะนำเลยค่ะ", product: "iPhone 13 Pro" },
            ].map((r, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
                <div className="text-xs text-slate-400">{r.name} &mdash; {r.product}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
            <span>4.9/5 คะแนน</span>
            <span>500+ ลูกค้า</span>
            <span>จ่ายทันที</span>
            <span>ตอบ &lt; 5 นาที</span>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 sm:p-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">พร้อมประเมินราคา?</h2>
          <p className="text-white/70 text-sm sm:text-base mb-7 max-w-md mx-auto">ส่งรูป + สเปค ทาง LINE ได้เลย ทีมงานตอบภายใน 5 นาที</p>
          <a
            href={BUSINESS_INFO.lineUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 text-white font-semibold px-7 py-3.5 hover:bg-brand-600 transition-colors shadow-md"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            LINE {BUSINESS_INFO.line}
          </a>
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
