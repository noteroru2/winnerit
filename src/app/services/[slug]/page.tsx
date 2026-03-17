import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteUrl, nodeCats } from "@/lib/wp";
import { getCachedServiceBySlug, getCachedServiceRelatedIndex, getCachedServiceSlugs } from "@/lib/wp-cache";
import { relatedByCategory } from "@/lib/related";
import { JsonLd } from "@/components/JsonLd";
import { jsonLdFaqPage } from "@/lib/jsonld";
import { stripHtml } from "@/lib/shared";
import { pageMetadata, inferDescriptionFromHtml } from "@/lib/seo";
import { jsonLdBreadcrumb } from "@/lib/jsonld";
import { jsonLdReviewAggregate } from "@/lib/jsonld";
import { serviceFaqSeed } from "@/lib/seoLocation";
import { isSiteMatch } from "@/lib/site-key";
import { BUSINESS_INFO } from "@/lib/constants";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const data = await getCachedServiceSlugs();
    const nodes = (data?.services?.nodes ?? []) as any[];
    const slugs = nodes
      .filter((n) => isSiteMatch(n?.site) && String(n?.status || "").toLowerCase() === "publish")
      .map((n) => String(n?.slug || "").trim())
      .filter(Boolean);
    return slugs.slice(0, 300).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

function toHtml(x: any) {
  return String(x ?? "").trim();
}

async function getServiceOrNull(slug: string) {
  const s = String(slug || "").trim();
  if (!s) return null;
  try {
    const data = await getCachedServiceSlugs();
    const nodes = (data?.services?.nodes ?? []) as any[];
    const hit = nodes.find(
      (n: any) =>
        isSiteMatch(n?.site) &&
        String(n?.status || "").toLowerCase() === "publish" &&
        String(n?.slug || "").toLowerCase() === s.toLowerCase()
    );
    if (!hit) return null;
  } catch { /* fallthrough */ }
  const bySlug = await getCachedServiceBySlug(s);
  const node = (bySlug?.services?.nodes ?? [])[0];
  if (!node) return null;
  if (String(node?.status || "").toLowerCase() !== "publish") return null;
  if (!isSiteMatch(node?.site)) return null;
  return node;
}

function pickPrimaryCategory(service: any) {
  const cats = service?.devicecategories?.nodes ?? [];
  if (!cats.length) return null;
  const withDesc = cats.find((c: any) => String(c?.description || "").trim());
  return withDesc || cats[0];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = String(params.slug || "").trim();
  if (!slug) return {};
  try {
    const service: any = await getServiceOrNull(slug);
    if (!service) return {};
    const pathname = `/services/${service.slug}`;
    const fallback = "บริการรับซื้อสินค้าไอที ประเมินไว นัดรับถึงที่ และจ่ายทันทีผ่าน LINE @webuy";
    const desc = inferDescriptionFromHtml(service.content, fallback);
    return pageMetadata({
      title: service.title || "บริการรับซื้อสินค้าไอที",
      description: desc,
      pathname,
    });
  } catch (error) {
    console.error("Error generating metadata for service:", slug, error);
    return {};
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const slug = String(params.slug || "").trim();
  if (!slug) notFound();

  const service = await getServiceOrNull(slug);
  if (!service) notFound();

  const emptyIndex = { locationpages: { nodes: [] as any[] }, pricemodels: { nodes: [] as any[] } };
  let index: any = emptyIndex;
  try {
    const cached = await getCachedServiceRelatedIndex();
    const r = cached ?? emptyIndex;
    index = {
      locationpages: { nodes: (r.locationpages?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site)) },
      pricemodels: { nodes: (r.pricemodels?.nodes ?? []).filter((n: any) => isSiteMatch(n?.site)) },
    };
  } catch (error) {
    console.error("Error fetching cached service related index:", error);
  }

  const relatedLocations = relatedByCategory(index?.locationpages?.nodes ?? [], service, 8);
  const relatedPrices = relatedByCategory(index?.pricemodels?.nodes ?? [], service, 8);

  const serviceCats = nodeCats(service);
  const primaryCat = pickPrimaryCategory(service);
  const primaryCatName = String(primaryCat?.name || primaryCat?.slug || "หมวดสินค้า").trim();

  const faqsAll = (index?.faqs?.nodes ?? []) as any[];
  const relatedFaqs = faqsAll
    .filter(
      (f) => f?.slug && serviceCats.some((c) => (f.devicecategories?.nodes ?? []).some((n: any) => n?.slug === c))
    )
    .slice(0, 20);

  const seedFaqs = serviceFaqSeed(service.title || "", primaryCatName);
  const faqItems = [
    ...relatedFaqs.map((f) => ({ title: String(f.question || f.title || "").trim(), answer: stripHtml(String(f.answer || "")) })),
    ...seedFaqs.map((f) => ({ title: f.q, answer: f.a })),
  ].filter((x) => x.title && x.answer);

  const pageUrl = `${siteUrl()}/services/${service.slug}`;
  const faqJson = faqItems.length > 0 ? jsonLdFaqPage(pageUrl, faqItems) : null;
  const reviewJson = jsonLdReviewAggregate(pageUrl, { name: service.title, ratingValue: 4.8, reviewCount: 124 });

  const cats = service.devicecategories?.nodes ?? [];
  const primaryCatSlug = String(primaryCat?.slug || "").trim();
  const catDesc = stripHtml(String(primaryCat?.description || "")).trim();
  const contentHtml = toHtml(service.content);

  const breadcrumbJson = jsonLdBreadcrumb(pageUrl, [
    { name: "Winner IT", url: `${siteUrl()}/` },
    { name: "หมวดสินค้า", url: `${siteUrl()}/categories` },
    ...(primaryCatSlug ? [{ name: primaryCatName, url: `${siteUrl()}/categories/${primaryCatSlug}` }] : []),
    { name: String(service.title || "บริการ"), url: pageUrl },
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <JsonLd json={breadcrumbJson} />
      {faqJson != null && <JsonLd json={faqJson} />}
      <JsonLd json={reviewJson} />

      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link className="hover:text-slate-700 transition-colors" href="/">หน้าแรก</Link></li>
          <li>/</li>
          <li><Link className="hover:text-slate-700 transition-colors" href="/categories">หมวดสินค้า</Link></li>
          {primaryCatSlug && (
            <>
              <li>/</li>
              <li><Link className="hover:text-slate-700 transition-colors" href={`/categories/${primaryCatSlug}`}>{primaryCatName}</Link></li>
            </>
          )}
          <li>/</li>
          <li className="text-slate-700 font-medium truncate max-w-[200px]">{service.title}</li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">บริการ</span>
          {cats.slice(0, 4).map((c: any) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="badge">{c.name || c.slug}</Link>
          ))}
        </div>

        <h1 className="h1">{service.title}</h1>

        <p className="lead">
          {catDesc || "ประเมินไวผ่าน LINE \u2022 นัดรับถึงที่ในพื้นที่บริการ \u2022 จ่ายเงินสด/โอนหน้างาน"}
        </p>

        <a
          className="btn btn-primary"
          href={BUSINESS_INFO.lineUrl}
          target="_blank"
          rel="noreferrer"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
          ติดต่อเรา LINE: {BUSINESS_INFO.line}
        </a>

        {/* Quick facts */}
        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          {[
            { icon: "⚡", t: "ประเมินไว", d: "ส่งรูป + สเปค ทาง LINE" },
            { icon: "📍", t: "นัดรับถึงที่", d: "ในเขตพื้นที่บริการ" },
            { icon: "💰", t: "จ่ายทันที", d: "เงินสด / โอนหน้างาน" },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-stone-50/50 p-4">
              <span className="text-lg">{x.icon}</span>
              <div>
                <div className="text-sm font-semibold text-slate-800">{x.t}</div>
                <div className="text-xs text-slate-500 mt-0.5">{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      {contentHtml && (
        <section className="space-y-6">
          <h2 className="h2">รายละเอียดบริการ</h2>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7">
            {contentHtml.includes("<") ? (
              <div className="wp-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            ) : (
              <div className="wp-content whitespace-pre-line">{contentHtml}</div>
            )}
          </article>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="space-y-5">
          <h2 className="h2">คำถามที่พบบ่อย</h2>
          <div className="space-y-3">
            {faqItems.map((f, i) => (
              <details key={i} className="faq">
                <summary>{f.title}</summary>
                <div className="answer">{f.answer}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-50 to-stone-50 border border-brand-100 p-6 sm:p-8 text-center">
        <div className="text-lg font-bold text-slate-900">ต้องการประเมินราคาไว?</div>
        <p className="text-sm text-slate-500 mt-1 mb-5">ส่งรูป + สเปค + สภาพ ทาง LINE แล้วทีมงานจะตอบกลับพร้อมช่วงราคา</p>
        <a
          className="btn btn-primary"
          href={BUSINESS_INFO.lineUrl}
          target="_blank"
          rel="noreferrer"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
          LINE: {BUSINESS_INFO.line}
        </a>
      </section>

      {/* Related */}
      {relatedLocations.length > 0 && (
        <section className="space-y-5">
          <h2 className="h2">พื้นที่ที่เกี่ยวข้อง</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedLocations.map((l: any) => (
              <Link key={l.slug} className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-soft" href={`/locations/${l.slug}`}>
                <div className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">{l.title}</div>
                {l.province && <div className="text-xs text-slate-400 mt-1">{l.province}</div>}
                <div className="mt-3 text-sm font-medium text-brand-600">ดูรายละเอียด &rarr;</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {relatedPrices.length > 0 && (
        <section className="space-y-5">
          <h2 className="h2">รุ่น/ราคาที่เกี่ยวข้อง</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPrices.map((p: any) => (
              <Link key={p.slug} className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-soft" href={`/prices/${p.slug}`}>
                <div className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">{p.title}</div>
                <div className="text-xs text-slate-400 mt-1">
                  ช่วงราคารับซื้อ: <span className="font-medium text-slate-600">{p.buyPriceMin}-{p.buyPriceMax}</span> บาท
                </div>
                <div className="mt-3 text-sm font-medium text-brand-600">ดูราคา &rarr;</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Internal links */}
      {cats.length > 0 && (
        <section className="rounded-2xl border border-slate-100 bg-stone-50/50 p-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">ลิงก์ที่เกี่ยวข้อง</div>
          <div className="flex flex-wrap gap-2">
            {cats.slice(0, 10).map((c: any) => (
              <Link key={c.slug} className="badge" href={`/categories/${c.slug}`}>
                {c.name || c.slug}
              </Link>
            ))}
            {relatedLocations.slice(0, 3).map((l: any) => (
              <Link key={l.slug} className="badge" href={`/locations/${l.slug}`}>{l.title}</Link>
            ))}
            {relatedPrices.slice(0, 3).map((p: any) => (
              <Link key={p.slug} className="badge" href={`/prices/${p.slug}`}>{p.title}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
