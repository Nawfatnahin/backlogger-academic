"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, Mail, Plus, Crown, ArrowLeft, Users, Search, Trash2, Monitor, Database, Zap, Key, RefreshCw, Copy, Clock, CheckCircle2, Lock, Unlock, ListChecks, UserCheck
} from "lucide-react";
import { toggleProStatus, deleteSubscription, generateAccessCode, getActiveCode, getAllWaitlistUsers, getAllProAccessList } from "./actions";
import { toast } from "sonner";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
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
    <div className="admin-theme min-h-screen bg-bg text-text-primary font-sans selection:bg-accent/20 selection:text-accent pb-20">
      <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border-default/50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-px h-6 bg-border-default/50" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <h1 className="text-base font-semibold tracking-tight">Admin Console</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm">
               {ownerEmail[0].toUpperCase()}
             </div>
             <span className="text-sm font-medium hidden sm:block text-text-secondary">{ownerEmail}</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-12 space-y-12">
        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 shadow-sm flex flex-col justify-between">
             <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Active Nodes</span>
             </div>
             <div>
                <p className="text-4xl font-bold tracking-tight">{totalGmails}</p>
                <p className="text-sm text-text-secondary mt-1">Total registered users</p>
             </div>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 shadow-sm flex flex-col justify-between">
             <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <Crown className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">System Master</span>
             </div>
             <div>
                <p className="text-2xl font-bold tracking-tight truncate" title={ownerEmail}>{ownerEmail}</p>
                <p className="text-sm text-text-secondary mt-1">Primary administrator</p>
             </div>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 shadow-sm flex flex-col justify-between">
             <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Elite Nodes</span>
             </div>
             <div>
                <p className="text-4xl font-bold tracking-tight">{premiumCount}</p>
                <p className="text-sm text-text-secondary mt-1">Active Pro subscriptions</p>
             </div>
          </div>
        </section>

        {/* Access Code Generator */}
        <section className="bg-bg-surface border border-border-default rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                  <Key className="w-5 h-5 text-accent" /> Access Code Generator
                </h2>
                <p className="text-sm text-text-secondary">Generate 8-character codes to grant users permanent Pro access.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Current Code</span>
                  {codeInfo?.code ? (
                    <div className="flex items-center justify-between p-4 bg-bg border border-border-default rounded-xl">
                      <span className="font-mono text-2xl font-bold tracking-widest text-text-primary select-all">
                        {codeInfo.code}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
                      >
                        {codeCopied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-bg border border-border-default border-dashed rounded-xl text-text-secondary text-sm flex items-center justify-center">
                      No active code
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-bg border border-border-default rounded-xl">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary block mb-2">Uses</span>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold">{codeInfo?.usesCount ?? 0}</span>
                      <span className="text-sm text-text-secondary mb-1">/ {codeInfo?.maxUses ?? 20}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${Math.min(((codeInfo?.usesCount ?? 0) / (codeInfo?.maxUses ?? 20)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-bg border border-border-default rounded-xl">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary block mb-2">Expiry</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="font-medium text-sm">{getCodeExpiryDisplay() ?? "—"}</span>
                    </div>
                    {codeInfo?.expiresAt && (
                      <p className="text-xs text-text-secondary mt-2">{new Date(codeInfo.expiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className={cn(
                  "p-4 rounded-xl border flex items-start gap-3",
                  codeInfo?.canGenerate
                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400"
                    : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-400"
                )}>
                  {codeInfo?.canGenerate ? (
                    <Unlock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">
                      {codeInfo?.canGenerate ? "Ready to Generate" : "Cooldown Active"}
                    </h3>
                    <p className="text-xs mt-1 opacity-90 leading-relaxed">
                      {codeInfo?.canGenerate
                        ? "No active cooldown. A new access code can be issued immediately."
                        : `${codeInfo?.cooldownDaysLeft ?? 3} day(s) remaining before the next code can be generated.`
                      }
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-border-default" />
                    Codes are 8-character alphanumeric
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-border-default" />
                    Each code expires after 3 days
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-border-default" />
                    Maximum 20 uses per code
                  </li>
                </ul>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={isGenerating || !codeInfo?.canGenerate}
                className={cn(
                  "mt-6 w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  codeInfo?.canGenerate && !isGenerating
                    ? "bg-accent text-white hover:bg-accent/90 active:scale-[0.98]"
                    : "bg-black/5 dark:bg-white/5 text-text-tertiary cursor-not-allowed"
                )}
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {isGenerating ? "Generating..." : "Generate New Code"}
              </button>
            </div>
          </div>
        </section>

        {/* Waitlist & Pro Access */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waitlist */}
          <div className="bg-bg-surface border border-border-default rounded-3xl p-6 shadow-sm flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-text-tertiary" /> Waitlist
              </h2>
              <span className="text-xs font-semibold bg-bg px-2.5 py-1 rounded-full border border-border-default text-text-secondary">
                {waitlistUsers.length} Users
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                value={waitlistSearch}
                onChange={(e) => setWaitlistSearch(e.target.value)}
                placeholder="Search waitlist..."
                className="w-full bg-bg border border-border-default rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredWaitlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-tertiary text-sm">
                  <Mail className="w-8 h-8 mb-2 opacity-50" />
                  No users found
                </div>
              ) : (
                filteredWaitlist.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-bg border border-border-default rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.email}</p>
                      <p className="text-xs text-text-tertiary">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pro Access List */}
          <div className="bg-bg-surface border border-border-default rounded-3xl p-6 shadow-sm flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-accent" /> Redemptions
              </h2>
              <span className="text-xs font-semibold bg-bg px-2.5 py-1 rounded-full border border-border-default text-text-secondary">
                {proAccessUsers.length} Users
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                value={proSearch}
                onChange={(e) => setProSearch(e.target.value)}
                placeholder="Search redemptions..."
                className="w-full bg-bg border border-border-default rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredProAccess.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-tertiary text-sm">
                  <Crown className="w-8 h-8 mb-2 opacity-50" />
                  No redemptions yet
                </div>
              ) : (
                filteredProAccess.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-bg border border-border-default rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.email}</p>
                      <p className="text-xs text-text-tertiary flex items-center gap-2">
                        <span className="font-mono bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded border border-border-default">{u.code_used}</span>
                        {new Date(u.granted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Registry Table */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-text-tertiary" /> Registry
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder="Search registry..."
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-accent transition-colors shadow-sm"
                />
              </div>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-text-primary text-bg px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] whitespace-nowrap shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Node
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
                  placeholder="Enter user email..."
                  className="w-full bg-bg border border-border-default rounded-xl py-2 pl-11 pr-4 text-sm focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
              <button type="submit" className="bg-accent text-white px-6 py-2 rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors">
                Authorize
              </button>
            </form>
          )}

          <div className="bg-bg-surface border border-border-default rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg border-b border-border-default">
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Identity</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Access Level</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredSubscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-bg/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-bg border border-border-default flex items-center justify-center font-semibold text-text-secondary text-sm">
                            {s.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{s.email}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">Joined {new Date(s.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                          isActuallyPro(s) 
                            ? "bg-accent/10 border-accent/20 text-accent" 
                            : "bg-bg border-border-default text-text-secondary"
                        )}>
                          {isActuallyPro(s) ? <Zap className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                          {isActuallyPro(s) ? 'Pro Access' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isActuallyPro(s) ? "bg-accent" : "bg-text-tertiary")} />
                          Active
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleTogglePro(s.email, s.plan)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                              s.plan === 'pro'
                                ? "bg-bg border-border-default text-text-secondary hover:text-text-primary"
                                : "bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-white"
                            )}
                          >
                            {s.plan === 'pro' ? 'Revoke' : 'Upgrade'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(s.email)}
                            className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                            title="Remove user"
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
            <div className="px-6 py-4 bg-bg border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">{filteredSubscriptions.length} nodes total</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
