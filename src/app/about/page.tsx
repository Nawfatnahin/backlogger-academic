import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-base font-body flex flex-col text-text-primary selection:bg-[#a67c52]/10 selection:text-[#a67c52]">
      <Navigation />
      
      <main className="flex-1 w-full">
        {/* SECTION 1 — Hero */}
        <section className="bg-bg-base pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <p className="text-[15px] font-medium uppercase tracking-widest text-[#a67c52] dark:text-[#c49a6c] mb-3">
                Our Story
              </p>
              <h1 className="text-[38px] md:text-[50px] font-bold tracking-tight text-gray-900 dark:text-white">
                Built for students,<br />
                <span className="bg-gradient-to-r from-[#a67c52] to-[#c49a6c] bg-clip-text text-transparent">
                  by a student.
                </span>
              </h1>
              <p className="text-[17px] leading-relaxed text-gray-600 dark:text-gray-300 mt-4">
                Scholar Atlas began from a simple frustration with messy and disconnected tools. 
                It was exhausting to use separate apps for attendance, tasks, grades, and documents. 
                This platform brings everything into one clean space designed specifically for university students.
              </p>
            </div>
          </div>
        </section>


        {/* SECTION 3 — Why We Built This */}
        <section className="bg-bg-base py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-[15px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                The Problem We Solved
              </p>
              <h2 className="text-[25px] md:text-[32px] font-semibold text-gray-900 dark:text-white">
                One tool to replace the chaos.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              {/* LEFT COLUMN — Text Content */}
              <div className="space-y-4">
                <p className="text-[17px] leading-relaxed text-gray-600 dark:text-gray-300">
                  University students juggle too many disconnected tools &mdash;
                  WhatsApp for schedules, Excel for grades, random apps for PDFs.
                </p>
                <p className="text-[17px] leading-relaxed text-gray-600 dark:text-gray-300">
                  Scholar Atlas consolidates attendance tracking, task management,
                  CGPA calculation and PDF processing into a single, unified dashboard.
                </p>
                <p className="text-[17px] leading-relaxed text-gray-600 dark:text-gray-300">
                  Everything is free to start, works on any device and is built
                  with student privacy as a non-negotiable.
                </p>
              </div>

              {/* RIGHT COLUMN — 2x2 Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="glass-card rounded-[24px] p-8">
                  <span className="block text-[32px] font-bold text-[#a67c52] dark:text-[#c49a6c]">
                    100+
                  </span>
                  <span className="block text-[15px] text-gray-500 dark:text-gray-400 mt-1">
                    Students using Scholar Atlas
                  </span>
                </div>
                <div className="glass-card rounded-[24px] p-8">
                  <span className="block text-[32px] font-bold text-[#a67c52] dark:text-[#c49a6c]">
                    4
                  </span>
                  <span className="block text-[15px] text-gray-500 dark:text-gray-400 mt-1">
                    Core tools built
                  </span>
                </div>
                <div className="glass-card rounded-[24px] p-8">
                  <span className="block text-[32px] font-bold text-[#a67c52] dark:text-[#c49a6c]">
                    Free
                  </span>
                  <span className="block text-[15px] text-gray-500 dark:text-gray-400 mt-1">
                    Forever, no credit card
                  </span>
                </div>
                <div className="glass-card rounded-[24px] p-8">
                  <span className="block text-[32px] font-bold text-[#a67c52] dark:text-[#c49a6c]">
                    2025
                  </span>
                  <span className="block text-[15px] text-gray-500 dark:text-gray-400 mt-1">
                    Year the project launched
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — Tools Overview */}
        <section className="bg-bg-base py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-[15px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                What&apos;s Inside
              </p>
              <h2 className="text-[25px] md:text-[32px] font-semibold text-gray-900 dark:text-white">
                Four tools. One command center.
              </h2>
              <p className="text-[17px] leading-relaxed text-gray-600 dark:text-gray-300 mt-4">
                Every tool is designed for the university student&apos;s actual workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Attendance Tracker */}
              <div className="glass-card rounded-[24px] p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#a67c52]/10 dark:bg-[#c49a6c]/20 text-[#a67c52] dark:text-[#c49a6c]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-white mt-5">
                  Attendance Tracker
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Log every class and stay safely above the minimum threshold.
                </p>
              </div>

              {/* Task Board */}
              <div className="glass-card rounded-[24px] p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#a67c52]/10 dark:bg-[#c49a6c]/20 text-[#a67c52] dark:text-[#c49a6c]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-white mt-5">
                  Task Board
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Kanban-style board built around assignments, quizzes and deadlines.
                </p>
              </div>

              {/* CGPA Manager */}
              <div className="glass-card rounded-[24px] p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#a67c52]/10 dark:bg-[#c49a6c]/20 text-[#a67c52] dark:text-[#c49a6c]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                  </svg>
                </div>
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-white mt-5">
                  CGPA Manager
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Track your grades, forecast your semester and hit your target GPA.
                </p>
              </div>

              {/* PDF Tools */}
              <div className="glass-card rounded-[24px] p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#a67c52]/10 dark:bg-[#c49a6c]/20 text-[#a67c52] dark:text-[#c49a6c]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-white mt-5">
                  PDF Tools
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Merge, split and convert PDFs entirely in your browser &mdash; privately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — Principles */}
        <section className="bg-bg-base py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-[25px] md:text-[32px] font-semibold text-gray-900 dark:text-white">
                What we believe in.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Privacy first */}
              <div className="bg-bg-surface dark:bg-bg-elevated p-8 rounded-2xl border border-border-strong dark:border-white/10 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-white">
                  Privacy first
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-3">
                  Your academic data is yours. We don&apos;t sell it, share it or store
                  what we don&apos;t need.
                </p>
              </div>

              {/* Speed matters */}
              <div className="bg-bg-surface dark:bg-bg-elevated p-8 rounded-2xl border border-border-strong dark:border-white/10 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-white">
                  Speed matters
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-3">
                  Every page loads in under a second. Slow tools cost you time you
                  don&apos;t have.
                </p>
              </div>

              {/* Student focused */}
              <div className="bg-bg-surface dark:bg-bg-elevated p-8 rounded-2xl border border-border-strong dark:border-white/10 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-white">
                  Student focused
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-3">
                  Every design decision is made by asking: does this actually help
                  a student get through the semester?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 — CTA */}
        <section className="bg-bg-base py-20 md:py-28 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-[25px] md:text-[32px] font-semibold text-gray-900 dark:text-white">
              Ready to take control of your semester?
            </h2>
            <p className="text-[17px] leading-relaxed text-gray-600 dark:text-gray-300 mt-4 mb-10 max-w-xl mx-auto">
              Join 100+ students who stopped juggling apps and started actually
              getting things done.
            </p>
            <div className="flex gap-4 justify-center flex-wrap mt-8">
              <Link
                href="/dashboard"
                className="bg-[#92400e] hover:bg-[#78350f] text-white px-8 py-4 rounded-lg font-medium transition-colors text-[17px]"
              >
                Get Started &mdash; it&apos;s free
              </Link>
              <Link
                href="/#features"
                className="bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 hover:border-[#a67c52]/50 dark:hover:border-[#c49a6c]/50 text-gray-700 dark:text-gray-300 hover:text-[#a67c52] dark:hover:text-[#c49a6c] hover:bg-white dark:hover:bg-gray-900 px-8 py-4 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow text-[17px]"
              >
                Explore features
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

