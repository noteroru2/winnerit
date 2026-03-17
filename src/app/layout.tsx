// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingLineButton } from "@/components/FloatingLineButton";
import { baseMetadata } from "@/lib/seo";
import { BUSINESS_INFO } from "@/lib/constants";

export const metadata: Metadata = baseMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://line.me" />
        <link rel="dns-prefetch" href="https://line.me" />
      </head>
      <body className="min-h-screen bg-stone-50 text-slate-800 antialiased">
        <div className="min-h-screen flex flex-col">
          <SiteHeader brand="Winner IT" />

          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer id="contact" className="mt-auto border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
              <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
                {/* Brand */}
                <div className="max-w-xs space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm font-bold shadow-sm">W</span>
                    <span className="text-lg font-bold text-slate-900">Winner IT</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    รับซื้ออุปกรณ์ไอทีถึงบ้าน ประเมินไว นัดรับถึงที่ จ่ายทันที
                  </p>
                  <a
                    href={BUSINESS_INFO.lineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                    LINE {BUSINESS_INFO.line}
                  </a>
                </div>

                {/* Links */}
                <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">เมนู</div>
                    <ul className="space-y-2.5 text-sm">
                      <li><Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">หน้าแรก</Link></li>
                      <li><Link href="/categories" className="text-slate-500 hover:text-slate-900 transition-colors">สินค้าที่รับซื้อ</Link></li>
                      <li><Link href="/locations" className="text-slate-500 hover:text-slate-900 transition-colors">พื้นที่บริการ</Link></li>
                      <li><Link href="/privacy-policy" className="text-slate-500 hover:text-slate-900 transition-colors">นโยบายความเป็นส่วนตัว</Link></li>
                      <li><Link href="/terms" className="text-slate-500 hover:text-slate-900 transition-colors">เงื่อนไขการใช้งาน</Link></li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">ติดต่อ</div>
                    <ul className="space-y-2.5 text-sm text-slate-500">
                      <li><a href={BUSINESS_INFO.phoneHref} className="hover:text-slate-900 transition-colors">{BUSINESS_INFO.phone}</a></li>
                      <li>{BUSINESS_INFO.hours}</li>
                      <li>{BUSINESS_INFO.address.province}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400">
                &copy; {new Date().getFullYear()} {BUSINESS_INFO.legalName} &mdash; {BUSINESS_INFO.name}
              </div>
            </div>
          </footer>
        </div>
        <FloatingLineButton />
      </body>
    </html>
  );
}
