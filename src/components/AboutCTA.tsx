"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutCTA() {
  return (
    <section className="py-20 bg-transparent overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="relative rounded-[32px] bg-stone-900/40 dark:bg-stone-900/30 backdrop-blur-xl p-10 sm:p-14 border border-stone-800/30 dark:border-white/10 shadow-xl overflow-hidden group">
          {/* Subtle Background Radial Accent */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 group-hover:opacity-75" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 group-hover:opacity-75" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-[640px]">
              <h2 className="font-display text-[28px] sm:text-[36px] lg:text-[42px] font-black leading-[1.15] tracking-tight text-white">
                Interested to know more <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500">about us</span>?
              </h2>

              <p className="text-[15px] sm:text-[16px] text-white/70 font-medium leading-relaxed">
                Learn about the vision behind Scholar Atlas, our privacy-first philosophy and our journey building open tools for university students.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-stone-900 font-body text-[15px] font-extrabold transition-all duration-300 hover:bg-amber-400 hover:text-stone-950 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-black/20 group/btn"
              >
                <span>Discover Our Story</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
