"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isFirstPage = pathname === "/";

  return (
    <footer className="pt-12 pb-8 border-t border-border-strong">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-12 mb-10">
            <div>
              <Link href="/" className="font-display text-[20px] flex items-center gap-1.5 no-underline tracking-tight mb-2.5 group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7 transition-transform group-hover:scale-110 text-accent dark:text-white"
                >
                  <path d="M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                  <path d="M18.816 13.58c2.292 2.138 3.546 4 3.092 4.9c-.745 1.46 -5.783 -.259 -11.255 -3.838c-5.47 -3.579 -9.304 -7.664 -8.56 -9.123c.464 -.91 2.926 -.444 5.803 .805" />
                </svg>
                <span className="font-normal text-ink dark:text-white">Scholar</span>
                <span className="font-bold text-accent dark:text-white">Atlas</span>
              </Link>
              <p className="text-[13px] text-ink-3 leading-[1.6] max-w-[280px]">
                The academic command center for university students. Fast, focused and free to start.
              </p>
            </div>
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-ink-3 mb-3.5">Product</h4>
              <div className="flex flex-col gap-2">
              <Link href="/tools/pdf" className="text-[14px] text-ink-2 hover:text-ink transition-colors">PDF Tools</Link>
                <Link href="/dashboard/attendance" className="text-[14px] text-ink-2 hover:text-ink transition-colors">Attendance</Link>
                <Link href="/dashboard/tasks" className="text-[14px] text-ink-2 hover:text-ink transition-colors">Task Tracker</Link>
                <Link href="/dashboard/cgpa" className="text-[14px] text-ink-2 hover:text-ink transition-colors">CGPA Manager</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-border-strong text-[13px] text-ink-3 gap-3">
            <span>© 2026 Scholar Atlas. All rights reserved.</span>
          </div>
        </div>
      </footer>
  );
}
