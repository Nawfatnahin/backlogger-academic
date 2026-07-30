"use client";

import { FileText, CalendarCheck, LayoutList, Shield, Globe, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/components/SubscriptionProvider";

export default function Features() {
  const { user } = useSubscription();

  const features = [
    {
      title: "Attendance Tracker",
      description: "Keep your percentage above the required threshold with automatic logging and smart target calculations.",
      icon: CalendarCheck,
      color: "from-emerald-500 to-emerald-700",
      shadow: "shadow-emerald-500/20",
      requiresAuth: true,
      href: "/dashboard/attendance"
    },
    {
      title: "Task Management",
      description: "A simple, academic focused Kanban board to manage assignments, quizzes and project deadlines.",
      icon: LayoutList,
      color: "from-indigo-500 to-indigo-700",
      shadow: "shadow-indigo-500/20",
      requiresAuth: true,
      href: "/dashboard/tasks"
    },
    {
      title: "CGPA Manager",
      description: "Dual-engine CGPA calculator with target forecasting and interactive grade tracking.",
      icon: GraduationCap,
      color: "from-orange-600 to-orange-800",
      shadow: "shadow-orange-600/20",
      requiresAuth: true,
      href: "/dashboard/cgpa"
    },
    {
      title: "Secure PDF Tools",
      description: "Merge, split and convert PDFs directly in your browser. Your files never touch our servers.",
      icon: FileText,
      color: "from-amber-500 to-amber-700",
      shadow: "shadow-amber-500/20",
      requiresAuth: false,
      href: "/tools/pdf"
    },
    {
      title: "Privacy First",
      description: "We don't sell your data. Your academic records are encrypted and yours alone.",
      icon: Shield,
      color: "from-rose-500 to-rose-700",
      shadow: "shadow-rose-500/20",
    },

    {
      title: "Accessible Anywhere",
      description: "Access your dashboard from your phone, tablet, or laptop. Stay organized on the go.",
      icon: Globe,
      color: "from-cyan-500 to-cyan-700",
      shadow: "shadow-cyan-500/20",
    },
  ];

  return (
    <section id="features" className="py-24 bg-transparent relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-display text-[32px] sm:text-[40px] lg:text-[64px] font-extrabold leading-[1.05] tracking-tight text-ink mb-6">
            Features for the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-accent">focused student</span>
          </h2>
          <p className="text-[19px] text-ink-2 leading-[1.65] font-medium">Everything you need to stop procrastinating and start dominating your semester.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[90%] mx-auto">
          {features.map((f, i) => {
            const isLocked = f.requiresAuth && !user;
            const CardWrapper = f.href ? Link : 'div';
            
            return (
              <CardWrapper 
                key={i} 
                href={f.href || "#"}
                className="group relative p-6 md:p-10 rounded-3xl md:rounded-[40px] bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.04),inset_0_1px_1px_white] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08),inset_0_1px_1px_white] hover:-translate-y-3 transition-all duration-500 ease-out overflow-hidden block"
              >
                {/* Background Glow on Hover */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-500`} />
                
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg ${f.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <f.icon className="w-8 h-8 text-white" />
                  </div>
                  {isLocked && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/50 text-blue-600/70 border border-blue-100 animate-in fade-in duration-700">
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">Unlock after signup →</span>
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl md:text-2xl font-black text-ink mb-3 md:mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">{f.title}</h3>
                <p className="text-ink-2 text-sm md:text-[15px] leading-relaxed font-medium">{f.description}</p>
                
                <div className="mt-8 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600/50 group-hover:text-indigo-600 transition-colors">
                  <span>{f.requiresAuth === false ? 'Public Tool' : 'Core Tool'}</span>
                  <div className="h-px flex-1 bg-indigo-100 group-hover:bg-indigo-200 transition-colors" />
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
