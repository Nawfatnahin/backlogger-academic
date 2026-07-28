"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, Mail, Plus, Crown, ArrowLeft, Users, Search, Trash2, Monitor, Database, Zap, Key, RefreshCw, Copy, Clock, CheckCircle2, Lock, Unlock, ListChecks, UserCheck, Sparkles, Activity
} from "lucide-react";
import { toggleProStatus, deleteSubscription, generateAccessCode, getActiveCode, getAllWaitlistUsers, getAllProAccessList } from "./actions";
import { toast } from "sonner";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Spotlight Card component with cursor-tracking refraction border
function SpotlightCard({ 
  children, 
  className,
  spotlightColor = "rgba(224, 122, 60, 0.14)"
}: { 
  children: React.ReactNode; 
  className?: string;
  spotlightColor?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border-default/80 bg-bg-surface p-7 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-0.5",
        className
      )}
    >
      {/* Background Texture Overlay */}
      <div 
        className="absolute inset-0 bg-[url('/admin_bg_texture.png')] bg-cover bg-center opacity-[0.03] dark:opacity-[0.08] pointer-events-none" 
      />

      {/* Interactive Spotlight Radial Gradient */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 rounded-3xl"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Refraction Top Edge Highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface Subscription {
  id: string;
  email: string;
  plan: string;
  premium_until?: string | null;
  created_at: string;
}

interface ActiveCodeInfo {
  code?: string;
  usesCount?: number;
  maxUses?: number;
  expiresAt?: string;
  createdAt?: string;
  cooldownDaysLeft?: number;
  canGenerate?: boolean;
}

interface WaitlistUser {
  id: string;
  email: string;
  created_at: string;
}

interface ProAccessUser {
  id: string;
  email: string;
  code_used: string;
  granted_at: string;
}

export default function AdminPanel({
  initialSubscriptions,
  ownerEmail,
  initialCodeInfo,
  initialWaitlist,
  initialProAccessList,
}: {
  initialSubscriptions: Subscription[];
  ownerEmail: string;
  initialCodeInfo: ActiveCodeInfo | null;
  initialWaitlist: WaitlistUser[];
  initialProAccessList: ProAccessUser[];
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions || []);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [registrySearch, setRegistrySearch] = useState("");
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const [proSearch, setProSearch] = useState("");

  // Code Generator State
  const [codeInfo, setCodeInfo] = useState<ActiveCodeInfo | null>(initialCodeInfo);
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Waitlist & Pro Access State
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>(initialWaitlist || []);
  const [proAccessUsers, setProAccessUsers] = useState<ProAccessUser[]>(initialProAccessList || []);

  const totalGmails = (subscriptions || []).length;
  const isActuallyPro = (s: Subscription) => s.plan === 'pro' && (!s.premium_until || new Date(s.premium_until) > new Date());
  const premiumCount = (subscriptions || []).filter(isActuallyPro).length;

  useEffect(() => {
    document.documentElement.classList.add('admin-theme');
    document.body.classList.add('admin-theme');
    return () => {
      document.documentElement.classList.remove('admin-theme');
      document.body.classList.remove('admin-theme');
    };
  }, []);

  const filteredSubscriptions = subscriptions
    .filter(s => s.email !== ownerEmail)
    .filter(s => s.email.toLowerCase().includes(registrySearch.toLowerCase()))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredWaitlist = waitlistUsers
    .filter(u => u.email.toLowerCase().includes(waitlistSearch.toLowerCase()));
    
  const filteredProAccess = proAccessUsers
    .filter(u => u.email.toLowerCase().includes(proSearch.toLowerCase()));

  const handleTogglePro = async (email: string, currentPlan: string) => {
    const isPro = currentPlan === 'pro';
    try {
      let durationMonths: number | null = null;
      if (!isPro) {
        const val = window.prompt("Enter duration in months (leave empty for unlimited):", "1");
        if (val === null) return;
        if (val.trim() !== "") {
          durationMonths = parseInt(val, 10);
          if (isNaN(durationMonths) || durationMonths <= 0) {
            toast.error("Invalid duration");
            return;
          }
        }
      }

      await toggleProStatus(email, !isPro, durationMonths);

      let premium_until = null;
      if (!isPro && durationMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() + durationMonths);
        premium_until = d.toISOString();
      }

      setSubscriptions(subscriptions.map(s => s.email === email ? { ...s, plan: !isPro ? 'pro' : 'free', premium_until } : s));
      toast.success(`${email} access updated.`);
    } catch {
      toast.error("Failed to update account.");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      const val = window.prompt("Enter duration in months (leave empty for unlimited):", "1");
      if (val === null) return;
      
      let durationMonths: number | null = null;
      if (val.trim() !== "") {
        durationMonths = parseInt(val, 10);
        if (isNaN(durationMonths) || durationMonths <= 0) {
          toast.error("Invalid duration");
          return;
        }
      }

      await toggleProStatus(newEmail, true, durationMonths);
      
      let premium_until = null;
      if (durationMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() + durationMonths);
        premium_until = d.toISOString();
      }

      const newUser = { id: Math.random().toString(), email: newEmail.toLowerCase(), plan: 'pro', premium_until, created_at: new Date().toISOString() };
      setSubscriptions(prev => [newUser, ...prev.filter(s => s.email !== newEmail.toLowerCase())]);
      
      setNewEmail("");
      setIsAdding(false);
      toast.success(`${newEmail} authorized.`);
    } catch {
      toast.error("Authorization failed.");
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Remove account ${email}?`)) return;
    try {
      const result = await deleteSubscription(email);
      if (result && !result.success) {
        toast.error(`Error: ${result.error}`);
        return;
      }
      setSubscriptions(subscriptions.filter(s => s.email !== email));
      toast.success(`${email} offline.`);
    } catch {
      toast.error(`Critical error.`);
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const result = await generateAccessCode();
      if (result.success && result.code) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);
        setCodeInfo({
          code: result.code,
          usesCount: 0,
          maxUses: 20,
          expiresAt: expiresAt.toISOString(),
          createdAt: new Date().toISOString(),
          cooldownDaysLeft: 3,
          canGenerate: false,
        });
        toast.success("New access code generated.");
      } else if (result.cooldownDaysLeft) {
        toast.error(`Cooldown active. ${result.cooldownDaysLeft} day(s) remaining.`);
      } else {
        toast.error(result.error || "Failed to generate code.");
      }
    } catch {
      toast.error("Code generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!codeInfo?.code) return;
    navigator.clipboard.writeText(codeInfo.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const getCodeExpiryDisplay = () => {
    if (!codeInfo?.expiresAt) return null;
    const exp = new Date(codeInfo.expiresAt);
    const now = new Date();
    const diff = exp.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <div className="admin-theme min-h-screen bg-bg text-text-primary font-sans selection:bg-accent/20 selection:text-accent pb-24 text-base">
      {/* Top Glass Header */}
      <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border-default/60 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-surface/50 border border-border-default/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-7 bg-border-default/50" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl text-accent">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-text-primary">Admin Console</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm shadow-sm">
               {ownerEmail[0].toUpperCase()}
             </div>
             <span className="text-sm font-semibold hidden sm:block text-text-secondary">{ownerEmail}</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-12 space-y-12">
        {/* Bento Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpotlightCard className="flex flex-col justify-between h-52">
             <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl border border-border-default/80 bg-bg/80 p-1.5 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="/icon_active_nodes.png" alt="Active Nodes Icon" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <Activity className="w-3.5 h-3.5" /> Node Pulse
                </div>
             </div>
             <div>
                <p className="text-5xl font-extrabold tracking-tight text-text-primary">{totalGmails}</p>
                <p className="text-sm font-semibold text-text-secondary mt-1.5">Total registered users</p>
             </div>
          </SpotlightCard>

          <SpotlightCard className="flex flex-col justify-between h-52">
             <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl border border-border-default/80 bg-bg/80 p-1.5 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="/icon_system_master.png" alt="System Master Icon" className="w-full h-full object-cover rounded-xl" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary bg-bg/80 border border-border-default px-2.5 py-1 rounded-md">Master Node</span>
             </div>
             <div>
                <p className="text-2xl font-bold tracking-tight truncate text-text-primary" title={ownerEmail}>{ownerEmail}</p>
                <p className="text-sm font-semibold text-text-secondary mt-1.5">Primary administrator account</p>
             </div>
          </SpotlightCard>

          <SpotlightCard className="flex flex-col justify-between h-52" spotlightColor="rgba(59, 130, 246, 0.14)">
             <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl border border-border-default/80 bg-bg/80 p-1.5 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="/icon_elite_nodes.png" alt="Elite Nodes Icon" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Elite Subscriptions
                </div>
             </div>
             <div>
                <p className="text-5xl font-extrabold tracking-tight text-text-primary">{premiumCount}</p>
                <p className="text-sm font-semibold text-text-secondary mt-1.5">Active Pro access licenses</p>
             </div>
          </SpotlightCard>
        </section>

        {/* Access Code Generator Section */}
        <SpotlightCard className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                    <Key className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">Access Code Generator</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">Generate 8-character single-use access codes to grant permanent Pro access to users.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Current Active Code</span>
                  {codeInfo?.code ? (
                    <div className="flex items-center justify-between p-4 bg-bg border border-border-default/80 rounded-2xl shadow-inner group">
                      <span className="font-mono text-3xl font-extrabold tracking-widest text-text-primary select-all">
                        {codeInfo.code}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-3 rounded-xl bg-bg-surface hover:bg-accent/10 hover:text-accent border border-border-default transition-all text-text-secondary active:scale-95"
                        title="Copy code"
                      >
                        {codeCopied ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-bg/50 border border-border-default border-dashed rounded-2xl text-text-tertiary text-sm flex items-center justify-center font-medium">
                      No active access code currently generated
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-bg/60 border border-border-default/60 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary block mb-1">Redemptions</span>
                    <div className="flex items-end gap-1.5">
                      <span className="text-2xl font-extrabold">{codeInfo?.usesCount ?? 0}</span>
                      <span className="text-sm font-semibold text-text-tertiary mb-0.5">/ {codeInfo?.maxUses ?? 20} max</span>
                    </div>
                    <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(((codeInfo?.usesCount ?? 0) / (codeInfo?.maxUses ?? 20)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-bg/60 border border-border-default/60 rounded-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary block mb-1">Time Limit</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="font-bold text-sm">{getCodeExpiryDisplay() ?? "—"}</span>
                    </div>
                    {codeInfo?.expiresAt && (
                      <p className="text-xs text-text-tertiary mt-1.5">{new Date(codeInfo.expiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border-default/60 pt-6 md:pt-0 md:pl-10">
              <div className="space-y-5">
                <div className={cn(
                  "p-5 rounded-2xl border flex items-start gap-3.5 transition-colors",
                  codeInfo?.canGenerate
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                )}>
                  {codeInfo?.canGenerate ? (
                    <Unlock className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm">
                      {codeInfo?.canGenerate ? "Ready for Generation" : "Cooldown Active"}
                    </h3>
                    <p className="text-xs mt-1 opacity-90 leading-relaxed font-medium">
                      {codeInfo?.canGenerate
                        ? "System clear. A new 8-character access token can be issued immediately."
                        : `${codeInfo?.cooldownDaysLeft ?? 3} day(s) remaining before a new code can be generated.`
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm font-medium text-text-secondary">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Codes expire automatically after 3 days
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Each code supports up to 20 unique redemptions
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Generates instant Pro privilege upon input
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={isGenerating || !codeInfo?.canGenerate}
                className={cn(
                  "mt-6 w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.98]",
                  codeInfo?.canGenerate && !isGenerating
                    ? "bg-accent text-white hover:bg-accent/90 shadow-accent/20 hover:shadow-md"
                    : "bg-black/5 dark:bg-white/5 text-text-tertiary cursor-not-allowed border border-border-default/40"
                )}
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-5 h-5" />}
                {isGenerating ? "Generating Token..." : "Generate New Access Code"}
              </button>
            </div>
          </div>
        </SpotlightCard>

        {/* Waitlist & Pro Access Bento Columns */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waitlist Box */}
          <SpotlightCard className="p-7 flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-text-tertiary/10 text-text-secondary rounded-xl">
                  <ListChecks className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">Waitlist Requests</h2>
              </div>
              <span className="text-xs font-bold bg-bg px-3 py-1 rounded-full border border-border-default text-text-secondary">
                {waitlistUsers.length} Pending
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                value={waitlistSearch}
                onChange={(e) => setWaitlistSearch(e.target.value)}
                placeholder="Search waitlist users..."
                className="w-full bg-bg border border-border-default/80 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent transition-colors font-medium"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {filteredWaitlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-tertiary text-sm font-medium">
                  <Mail className="w-8 h-8 mb-2 opacity-40" />
                  No matching waitlist requests
                </div>
              ) : (
                filteredWaitlist.map(u => (
                  <div key={u.id} className="flex items-center gap-3.5 p-3.5 bg-bg/60 border border-border-default/50 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all hover:translate-x-0.5">
                    <div className="w-8 h-8 rounded-lg bg-bg border border-border-default flex items-center justify-center text-xs font-extrabold text-text-secondary">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-text-primary">{u.email}</p>
                      <p className="text-xs font-medium text-text-tertiary">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SpotlightCard>

          {/* Pro Access List Box */}
          <SpotlightCard className="p-7 flex flex-col h-[520px]" spotlightColor="rgba(59, 130, 246, 0.14)">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">Active Redemptions</h2>
              </div>
              <span className="text-xs font-bold bg-bg px-3 py-1 rounded-full border border-border-default text-text-secondary">
                {proAccessUsers.length} Redeemed
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                value={proSearch}
                onChange={(e) => setProSearch(e.target.value)}
                placeholder="Search redemptions..."
                className="w-full bg-bg border border-border-default/80 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent transition-colors font-medium"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {filteredProAccess.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-tertiary text-sm font-medium">
                  <Crown className="w-8 h-8 mb-2 opacity-40" />
                  No code redemptions recorded
                </div>
              ) : (
                filteredProAccess.map(u => (
                  <div key={u.id} className="flex items-center gap-3.5 p-3.5 bg-bg/60 border border-border-default/50 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all hover:translate-x-0.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-text-primary">{u.email}</p>
                      <p className="text-xs font-medium text-text-tertiary flex items-center gap-2">
                        <span className="font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-border-default font-bold text-text-primary">{u.code_used}</span>
                        {new Date(u.granted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </SpotlightCard>
        </section>

        {/* User Registry Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">User Registry</h2>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder="Search user registry..."
                  className="w-full bg-bg-surface border border-border-default/80 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent transition-colors shadow-xs font-medium"
                />
              </div>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-accent/90 transition-all active:scale-95 whitespace-nowrap shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Authorize Node
              </button>
            </div>
          </div>

          {isAdding && (
            <form onSubmit={handleAddUser} className="bg-bg-surface border border-border-default p-6 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                <input 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="w-full bg-bg border border-border-default/80 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-accent transition-colors font-medium"
                  required
                />
              </div>
              <button type="submit" className="bg-text-primary text-bg px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                Authorize Access
              </button>
            </form>
          )}

          <div className="bg-bg-surface border border-border-default/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg/60 border-b border-border-default/60">
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">User Identity</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/40">
                  {filteredSubscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-bg/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-bg border border-border-default/60 flex items-center justify-center font-extrabold text-text-secondary text-sm">
                            {s.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">{s.email}</p>
                            <p className="text-xs text-text-tertiary mt-0.5 font-medium">Registered {new Date(s.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border",
                          isActuallyPro(s) 
                            ? "bg-accent/10 border-accent/20 text-accent" 
                            : "bg-bg/80 border-border-default/60 text-text-secondary"
                        )}>
                          {isActuallyPro(s) ? <Zap className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                          {isActuallyPro(s) ? 'Pro Access' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                          <span className={cn("w-2 h-2 rounded-full", isActuallyPro(s) ? "bg-accent animate-pulse" : "bg-text-tertiary")} />
                          Active
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleTogglePro(s.email, s.plan)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95",
                              s.plan === 'pro'
                                ? "bg-bg border-border-default text-text-secondary hover:text-text-primary"
                                : "bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-white"
                            )}
                          >
                            {s.plan === 'pro' ? 'Revoke Pro' : 'Grant Pro'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(s.email)}
                            className="p-2 text-text-tertiary hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                            title="Remove account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-bg/40 border-t border-border-default/60 flex items-center justify-between">
              <span className="text-xs text-text-secondary font-semibold">{filteredSubscriptions.length} registered accounts</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
