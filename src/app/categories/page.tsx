import Link from "next/link";
import { fetchGql } from "@/lib/wp";
import { Q_HUB_INDEX } from "@/lib/queries";
import { getCategoriesFromHub } from "@/lib/categories";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BUSINESS_INFO } from "@/lib/constants";
import { isSiteMatch } from "@/lib/site-key";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: "หมวดสินค้า | Winner IT",
  description:
    "รวมหมวดสินค้ารับซื้ออุปกรณ์ไอที โน๊ตบุ๊ค มือถือ แท็บเล็ต เลือกหมวดเพื่อดูบริการรับซื้อ พื้นที่ให้บริการ และราคารับซื้อ",
  pathname: "/categories",
});

const CATEGORY_ICONS: Record<string, string> = {
  notebook: "💻",
  mobile: "📱",
  tablet: "📱",
  computer: "🖥️",
  accessories: "⌨️",
  camera: "📷",
  gaming: "🎮",
  smartwatch: "⌚",
};

export default async function Page() {
  const raw = await fetchGql<any>(Q_HUB_INDEX, undefined, { revalidate });
  const data = raw ?? {};
  const dataForCategories = {
    ...data,
    devicecategories: {
      nodes: (data.devicecategories?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site)),
    },
  };
  const categories = getCategoriesFromHub(dataForCategories);

  return (
    <div className="min-h-[60vh]">
      {/* Hero: สั้น กระชับ ไม่มีกล่อง 0 แยก */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <nav className="mb-6 text-sm">
            <Link href="/" className="text-white/70 hover:text-white">หน้าแรก</Link>
            <span className="mx-2 text-white/50">/</span>
            <span className="text-white">หมวดสินค้า</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            หมวดสินค้า
          </h1>
          <p className="mt-3 max-w-xl text-white/80 text-sm sm:text-base">
            เลือกหมวดที่สนใจเพื่อดูบริการรับซื้อ พื้นที่ให้บริการ ราคารับซื้อ และคำถามที่พบบ่อย
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition"
              href={BUSINESS_INFO.lineUrl}
              target="_blank"
              rel="noreferrer"
            >
              💬 แชท LINE
            </a>
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
              href="/"
            >
              ← กลับหน้าแรก
            </Link>
          </div>
        </div>
      </section>

      {/* รายการหมวด: grid การ์ดมีไอคอน สวยงาม */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            รายการหมวดสินค้า
            {categories.length > 0 && (
              <span className="ml-2 text-slate-500 font-normal">({categories.length} หมวด)</span>
            )}
          </h2>
        </div>

        {categories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl transition group-hover:bg-brand-100">
                  {CATEGORY_ICONS[c.slug] ?? "📦"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {c.name}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {c.count > 0 ? `${c.count} รายการ` : "บริการ • พื้นที่ • ราคา"}
                  </div>
                </div>
                <span className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-500">
                  →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ยังไม่มีหมวดสินค้า</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              กำลังเพิ่มหมวดสินค้าใหม่ ติดต่อ LINE เพื่อสอบถามหรือประเมินราคาได้เลย
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
    </div>
  );
}
