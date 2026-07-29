"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Check, Heart, X, Mail, Key, Loader2, CheckCircle2, AlertCircle, Share2 } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";
import { addToWaitlist, redeemAccessCode } from "@/app/dashboard/admin/actions";

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────
// WISHLIST POPUP COMPONENT
// ─────────────────────────────────────────────
function WishlistPopup({ onClose, userEmail }: { onClose: () => void; userEmail: string }) {
  const [email, setEmail] = useState(userEmail || "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "success" | "pro-success" | "code-limit">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const trimmedCode = code.trim().toUpperCase();
      const hasCode = trimmedCode.length > 0;

      // Always add to waitlist first
      await addToWaitlist(email);

      if (hasCode) {
        // Try to redeem the code
        const result = await redeemAccessCode(trimmedCode, email);
        if (result.success) {
          setStep("pro-success");
          // Reload after 3 seconds so subscription refreshes
          setTimeout(() => window.location.reload(), 3000);
        } else if (result.limitReached) {
          setStep("code-limit");
        } else {
          setError(result.error || "Invalid code. Your email has been saved to the waitlist.");
          setStep("success");
        }
      } else {
        setStep("success");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
    >
      <div
        className={cn(
          "relative w-full max-w-[480px] rounded-[32px] overflow-hidden shadow-2xl",
          "bg-bg dark:bg-[#1a1a1a] border border-border-strong dark:border-white/10",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2 rounded-xl bg-bg dark:bg-white/5 border border-border-strong dark:border-white/10 text-ink-3 dark:text-white/40 hover:text-ink dark:hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {step === "form" && (
          <div className="p-8 space-y-7">
            {/* Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Pro Access</span>
              </div>
              <h3 className="text-2xl font-serif font-black text-ink dark:text-white leading-tight">
                Join the Wishlist
              </h3>
              <p className="text-sm text-ink-2 dark:text-white/60 leading-relaxed">
                Sorry, we will make the payment feature in future updates. Stay tuned and support us by sharing our website.
              </p>
            </div>

            {/* Share CTA */}
            <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-accent" />
              </div>
              <p className="text-[12px] text-ink-2 dark:text-white/60 leading-relaxed">
                <span className="font-bold text-ink dark:text-white">Support us</span> — share Scholar Atlas with your classmates and help us grow!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink-3 dark:text-white/40">
                  Your Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4 dark:text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className={cn(
                      "w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all",
                      "bg-bg dark:bg-white/5 border border-border-strong dark:border-white/10",
                      "text-ink dark:text-white placeholder:text-ink-4 dark:placeholder:text-white/25",
                      "focus:border-accent dark:focus:border-accent/60"
                    )}
                  />
                </div>
              </div>

              {/* Code Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink-3 dark:text-white/40 flex items-center gap-2">
                  Access Code
                  <span className="text-ink-4 dark:text-white/20 font-medium normal-case tracking-normal">(optional — for permanent Pro)</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4 dark:text-white/30" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
                    placeholder="Enter 8-digit code"
                    maxLength={8}
                    className={cn(
                      "w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono font-bold outline-none tracking-widest transition-all uppercase",
                      "bg-bg dark:bg-white/5 border border-border-strong dark:border-white/10",
                      "text-ink dark:text-white placeholder:text-ink-4 dark:placeholder:text-white/25 placeholder:tracking-normal placeholder:font-normal",
                      "focus:border-accent dark:focus:border-accent/60"
                    )}
                  />
                </div>
                <p className="text-[10px] text-ink-4 dark:text-white/25 pl-1">
                  Have an access code? Enter it above to unlock permanent Pro access instantly.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className={cn(
                  "w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2.5",
                  "bg-accent text-white hover:bg-accent/90 active:scale-[0.98] shadow-sm shadow-accent/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                {isSubmitting ? "Processing..." : code.length === 8 ? "Redeem Code & Join" : "Join Wishlist"}
              </button>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-black text-ink dark:text-white">You&apos;re on the list! 🎉</h3>
              <p className="text-sm text-ink-2 dark:text-white/60 leading-relaxed max-w-[300px] mx-auto">
                We&apos;ll notify you when Pro launches. Thank you for your support — it means the world to us!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        )}

        {step === "pro-success" && (
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
                <Heart className="w-10 h-10 text-orange-500 fill-orange-500 animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                Pro Access Unlocked
              </div>
              <h3 className="text-2xl font-serif font-black text-ink dark:text-white">Welcome to Pro! 🚀</h3>
              <p className="text-sm text-ink-2 dark:text-white/60 leading-relaxed max-w-[300px] mx-auto">
                Your code was valid. You now have <span className="font-bold text-ink dark:text-white">permanent Pro access</span>. Refreshing your dashboard now...
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-3 dark:text-white/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              Refreshing...
            </div>
          </div>
        )}

        {step === "code-limit" && (
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-black text-ink dark:text-white">Code Limit Reached</h3>
              <p className="text-sm text-ink-2 dark:text-white/60 leading-relaxed max-w-[300px] mx-auto">
                This access code has reached its usage limit. Your email has been added to the waitlist — we&apos;ll notify you when Pro launches!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all active:scale-95"
            >
              Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PRICING COMPONENT
// ─────────────────────────────────────────────
export default function Pricing() {
  const { user, isPro, isAdmin, loading } = useSubscription();
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  if (loading) {
    return (
      <section id="pricing" className="py-[140px] bg-transparent overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-8 animate-pulse">
          <div className="h-10 w-32 bg-stone-200 rounded-full mx-auto mb-10" />
          <div className="h-16 w-3/4 bg-stone-200 rounded-2xl mx-auto mb-6" />
          <div className="h-6 w-1/2 bg-stone-200 rounded-xl mx-auto mb-14" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[860px] mx-auto">
            <div className="h-[500px] bg-stone-100 rounded-[24px]" />
            <div className="h-[500px] bg-stone-100 rounded-[24px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="pricing" className="py-[140px] bg-transparent overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="text-center mb-10">
          </div>
          
          <h2 className="font-display text-[32px] sm:text-[40px] lg:text-[56px] font-extrabold leading-[1.1] tracking-tight text-ink text-center mb-6">
            {isPro ? (
              isAdmin ? (
                <>You&apos;re the <span className="text-accent">boss</span>.</>
              ) : (
                <>You&apos;re a <span className="text-accent">legend</span>.</>
              )
            ) : (
              <>Simple pricing for <span className="text-accent">students</span>.</>
            )}
          </h2>
          
          <p className="text-[18px] text-ink-2 text-center max-w-[520px] mx-auto mb-14 leading-[1.65]">
            {isPro 
              ? (isAdmin ? "Welcome back, Chief. You have absolute power over the buddy's ecosystem." : "Your support fuels our mission to help students succeed. Thank you for being part of the family.")
              : "Start free. Upgrade when you need more. No confusing tiers, no hidden fees."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-[1000px] mx-auto items-stretch">
            {/* Left Side: Thank you (Pro) or Free Plan */}
            {isPro ? (
              <div className="relative group perspective-1000">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-12 rounded-[32px] bg-white border border-amber-500/20 shadow-[0_20px_50px_rgba(146,64,14,0.15)] flex flex-col items-center justify-center text-center space-y-8 min-h-[500px] transition-all duration-500 transform-gpu group-hover:-translate-y-3 group-hover:rotate-1 group-hover:shadow-[0_40px_80px_rgba(146,64,14,0.25)]">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Heart className="w-12 h-12 text-orange-500 fill-orange-500 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black uppercase tracking-widest">
                      {isAdmin ? "Super Admin" : "Elite Status"}
                    </div>
                    <h3 className="font-display text-[32px] font-black text-ink leading-tight">
                      {isAdmin ? "Ultimate" : "Infinite"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">{isAdmin ? "Control" : "Gratitude"}</span>
                    </h3>
                    <p className="text-[16px] text-ink-2 font-medium leading-relaxed max-w-[320px] mx-auto">
                      {isAdmin 
                        ? "Full system overrides active. Your vision drives this project forward every single day."
                        : "Thank you for being a Premium member! Your support fuels our innovation and keeps the buddy growing every day."}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-amber-200 group-hover:bg-amber-400 group-hover:scale-125 transition-all duration-500" style={{ transitionDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                  
                  {/* 3D Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl animate-pulse delay-700"></div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-9 rounded-[24px] border-2 border-accent-premium relative shadow-[0_20px_40px_-10px_rgba(193,154,107,0.2)] transition-all duration-400 hover:-translate-y-2 hover:border-amber-500 hover:shadow-[0_0_10px_rgba(245,158,11,0.4),0_0_20px_rgba(245,158,11,0.2),0_30px_50px_-10px_rgba(193,154,107,0.3)]">
                <div className="font-display text-[15px] font-bold tracking-wide mb-3">Free</div>
                <div className="font-display text-[32px] sm:text-[40px] font-extrabold tracking-tight text-ink leading-none mb-1.5">$0 / 0 BDT</div>
                <div className="text-[13px] text-ink-3 mb-7">forever · no credit card</div>
                <div className="h-px bg-border-strong mb-6"></div>
                <ul className="list-none space-y-0 mb-7">
                  {[
                    { text: "5 PDF operations per month", helper: "(1 operation = 1 merge, split, or convert action)" },
                    { text: "Up to 10 subjects" },
                    { text: "Unlimited attendance records" },
                    { text: "Up to 20 active tasks" }
                  ].map((f, i) => (
                    <li key={i} className="py-2 border-b border-border-subtle last:border-0">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-[14px] text-ink-2">{f.text}</span>
                      </div>
                      {f.helper && (
                        <div className="text-[11px] text-ink-3 ml-6.5 mt-0.5">{f.helper}</div>
                      )}
                    </li>
                  ))}
                </ul>
                <Link 
                  href={user ? "/dashboard" : "/signup"} 
                  className="block text-center w-full bg-white dark:bg-bg-elevated border border-border-strong dark:border-white/10 text-ink dark:text-white font-body text-[14px] font-bold p-3.5 rounded-xl transition-all hover:bg-bg dark:hover:bg-bg-surface hover:border-black/20 dark:hover:border-white/20"
                >
                  {user ? "Go to Dashboard" : "Get started free"}
                </Link>
              </div>
            )}

            {/* Pro Plan */}
            <div className={cn(
              "p-9 rounded-[24px] bg-ink border transition-all duration-400 hover:-translate-y-2 relative overflow-hidden",
              isPro 
                ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]" 
                : "border-ink shadow-[0_20px_30px_-10px_rgba(0,0,0,0.3)] hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.6),0_0_30px_rgba(59,130,246,0.3),0_20px_30px_-10px_rgba(0,0,0,0.5)]"
            )}>
              <div className="inline-block bg-accent text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-5 shadow-[0_2px_4px_rgba(43,43,43,0.3)]">
                {isPro ? "Your Current Plan" : "Most popular"}
              </div>
              <div className="font-display text-[15px] font-bold tracking-wide mb-3 text-white/60">Pro</div>
              <div className="font-display text-[32px] sm:text-[40px] font-extrabold tracking-tight text-white leading-none mb-1.5">$1.99 / 239 BDT</div>
              <div className="text-[13px] text-white/50 mb-7">per month · billed yearly</div>
              <div className="h-px bg-white/10 mb-6"></div>
              <ul className="list-none space-y-0 mb-7">
                {[
                  "Unlimited PDF operations",
                  "Unlimited subjects",
                  "Unlimited attendance records",
                  "Unlimited tasks",
                  "Priority processing speed",
                  "Early access to new features"
                ].map((f, i) => (
                  <li key={i} className="text-[14px] py-2 flex items-center gap-2.5 text-white/75 border-b border-white/10 last:border-0">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA — Dynamic based on auth state */}
              {isPro ? (
                <Link 
                  href="/dashboard" 
                  className="block text-center w-full bg-ink border-2 border-amber-500 text-white font-body text-[15px] font-black p-4 rounded-xl transition-all hover:bg-amber-500 hover:text-ink hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                >
                  Go to Dashboard
                </Link>
              ) : !user ? (
                // Guest: Show "Get Started Free" → /signup
                <Link
                  href="/signup"
                  className="block text-center w-full bg-white dark:bg-accent text-stone-900 dark:text-white font-body text-[14px] font-bold p-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg dark:hover:bg-accent/90"
                >
                  Get Started Free
                </Link>
              ) : (
                // Logged in, not pro: Show "Join Wishlist" → popup
                <button
                  onClick={() => setIsWishlistOpen(true)}
                  className="block text-center w-full bg-white dark:bg-accent text-stone-900 dark:text-white font-body text-[14px] font-bold p-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg dark:hover:bg-accent/90"
                >
                  Join Wishlist
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Wishlist Popup */}
      {isWishlistOpen && user && (
        <WishlistPopup
          onClose={() => setIsWishlistOpen(false)}
          userEmail={user.email ?? ""}
        />
      )}
    </>
  );
}
