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
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://line.me" />
        <link rel="dns-prefetch" href="https://line.me" />
      </head>
      <body className="min-h-screen bg-slate-200 text-slate-900 antialiased">
        <div className="min-h-screen flex flex-col items-center py-4 sm:py-6 px-3 sm:px-4">
          <div className="w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden bg-white flex flex-col min-h-0">
            <SiteHeader brand="Winner IT" />

            <main className="flex-1 min-h-[50vh]">{children}</main>

            {/* CONTACT + FOOTER: แถบเดียว มินิมอล */}
            <footer id="contact" className="bg-slate-900 text-slate-300">
              <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
              {/* ซ้าย: แบรนด์ + LINE ใหญ่ */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">W</div>
                  <span className="text-lg font-bold text-white">Winner IT</span>
                </div>
                <p className="text-sm text-slate-400 max-w-xs">
                  รับซื้ออุปกรณ์ไอทีถึงบ้าน ประเมินไว นัดรับถึงที่ จ่ายทันที
                </p>
                <a
                  href={BUSINESS_INFO.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 transition"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                  LINE {BUSINESS_INFO.line}
                </a>
              </div>
              {/* ขวา: ลิงก์ + โทร/ที่อยู่ */}
              <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">เมนู</div>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/" className="hover:text-white transition">หน้าแรก</Link></li>
                    <li><Link href="/categories" className="hover:text-white transition">สินค้าที่รับซื้อ</Link></li>
                    <li><Link href="/locations" className="hover:text-white transition">พื้นที่บริการ</Link></li>
                    <li><Link href="/privacy-policy" className="hover:text-white transition">นโยบายความเป็นส่วนตัว</Link></li>
                    <li><Link href="/terms" className="hover:text-white transition">เงื่อนไขการใช้งาน</Link></li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">ติดต่อ</div>
                  <ul className="space-y-2 text-sm">
                    <li><a href={BUSINESS_INFO.phoneHref} className="hover:text-white transition">📞 {BUSINESS_INFO.phone}</a></li>
                    <li><span>🕐 {BUSINESS_INFO.hours}</span></li>
                    <li className="text-slate-400">{BUSINESS_INFO.address.province}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-700 text-xs text-slate-500">
              © {new Date().getFullYear()} {BUSINESS_INFO.legalName} — {BUSINESS_INFO.name}
            </div>
              </div>
            </footer>
          </div>
        </div>
        <FloatingLineButton />
      </body>
    </html>
  );
}
