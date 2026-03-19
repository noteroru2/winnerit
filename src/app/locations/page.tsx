import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getCachedLocationSlugs } from "@/lib/wp-cache";
import { BUSINESS_INFO } from "@/lib/constants";
import { includeHubNodeForSite } from "@/lib/site-key";

/** ดึงรายการพื้นที่ตอน request — เหตุผลเดียวกับหน้าแรก */
export const dynamic = "force-dynamic";

export const revalidate = 86400;

function isPublish(status: any) {
  return String(status || "").toLowerCase() === "publish";
}

export const metadata: Metadata = pageMetadata({
  title: "พื้นที่บริการรับซื้อโน๊ตบุ๊ค • เลือกจังหวัด/อำเภอ | Winner IT",
  description:
    "รวมพื้นที่บริการรับซื้อโน๊ตบุ๊คทั่วไทย เลือกจังหวัดเพื่อดูอำเภอ/เขตที่ให้บริการ ประเมินไว • นัดรับถึงที่ • จ่ายทันที ติดต่อ LINE: @webuy โทร: 064-2579353",
  pathname: "/locations",
});

export default async function Page() {
  let locations: any[] = [];

  try {
    const data = await getCachedLocationSlugs();
    const nodes = (data?.locationpages?.nodes ?? [])
      .filter((n: any) => {
        if (!n?.slug || !isPublish(n?.status)) return false;
        return includeHubNodeForSite(n?.site);
      })
      .sort((a: any, b: any) => String(a.title || "").localeCompare(String(b.title || ""), "th"));
    if (nodes.length > 0) locations = nodes;
  } catch {
    // ignore
  }

  return (
    <div className="min-h-[60vh]">
      {/* Breadcrumb */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <li><Link href="/" className="hover:text-brand-600">หน้าแรก</Link></li>
            <li className="text-slate-400">/</li>
            <li className="font-semibold text-slate-900">พื้นที่บริการ</li>
          </ol>
        </div>
      </nav>

      {/* Hero: สั้น มืด ศูนย์กลาง + ปุ่มเดียว */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            รับซื้อโน๊ตบุ๊ค
            <span className="block mt-1 text-brand-400">ครอบคลุมทุกจังหวัด</span>
          </h1>
          <p className="mt-4 max-w-lg text-white/80 text-sm sm:text-base">
            นัดรับถึงบ้านทั่วไทย • ประเมินฟรีทาง LINE • จ่ายเงินสดทันที
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={BUSINESS_INFO.lineUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition"
            >
              💬 LINE: {BUSINESS_INFO.line}
            </a>
            <a
              href={BUSINESS_INFO.phoneHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              📞 {BUSINESS_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      {/* สถิติ + หน้าร้าน: แถบเดียว ไม่ใช้ sidebar ใหญ่ */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-xl text-brand-600">
                📍
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{locations.length}</div>
                <div className="text-xs text-slate-500">จังหวัดที่ให้บริการ</div>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-xl">
                🏪
              </div>
              <div>
                <div className="font-semibold text-slate-900">หน้าร้าน</div>
                <div className="text-sm text-slate-600">{BUSINESS_INFO.address.province}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* รายการจังหวัด */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-lg font-bold text-slate-900 mb-6">
          เลือกพื้นที่บริการ
          {locations.length > 0 && (
            <span className="ml-2 font-normal text-slate-500">({locations.length} จังหวัด)</span>
          )}
        </h2>

        {locations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc: any) => (
              <Link
                key={loc.slug}
                href={`/locations/${loc.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl transition group-hover:bg-brand-100">
                  📍
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {loc.title || loc.province || "ไม่ระบุชื่อ"}
                  </div>
                  {(loc.devicecategories?.nodes ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(loc.devicecategories?.nodes ?? []).slice(0, 2).map((cat: any) => (
                        <span key={cat.slug} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {cat.name}
                        </span>
                      ))}
                      {(loc.devicecategories?.nodes ?? []).length > 2 && (
                        <span className="text-xs text-slate-400">+{(loc.devicecategories?.nodes ?? []).length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-500">
                  →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">กำลังเพิ่มพื้นที่บริการ</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              ติดต่อสอบถามพื้นที่บริการได้ทาง LINE หรือโทร {BUSINESS_INFO.phone}
            </p>
            <a
              href={BUSINESS_INFO.lineUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition"
            >
              💬 แชท LINE
            </a>
          </div>
        )}
      </section>

      {/* CTA เดียว ท้ายหน้า */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-center text-sm text-slate-600 mb-4">
            ส่งรูป + รุ่น/สเปค ทาง LINE เพื่อประเมินราคาฟรี
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={BUSINESS_INFO.lineUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition"
            >
              💬 LINE
            </a>
            <a href={BUSINESS_INFO.phoneHref} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              📞 โทร
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
