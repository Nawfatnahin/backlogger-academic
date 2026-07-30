"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Bug, Sparkles, Send, CheckCircle2, AlertCircle, Loader2, Clock, HelpCircle, X } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";
import { submitFeedback } from "@/app/dashboard/admin/actions";
import { toast } from "sonner";

const FEEDBACK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOCAL_STORAGE_KEY = "scholar_atlas_feedback_timestamp";

function formatRemainingTime(ms: number) {
  if (ms <= 0) return "0h 0m 0s";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function FeedbackSection() {
  const { user } = useSubscription();
  const [category, setCategory] = useState<"bug" | "feature" | "feedback">("bug");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState<number | null>(null);

  // Check cooldown on mount and tick every second
  useEffect(() => {
    const checkCooldown = () => {
      const savedTime = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedTime) {
        const elapsed = Date.now() - Number(savedTime);
        const remaining = FEEDBACK_COOLDOWN_MS - elapsed;
        if (remaining > 0) {
          setCooldownRemainingMs(remaining);
        } else {
          setCooldownRemainingMs(0);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      } else {
        setCooldownRemainingMs(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter your message, Sir.");
      return;
    }
    if (cooldownRemainingMs && cooldownRemainingMs > 0) {
      toast.error(`Feedback limit reached, Sir. Please wait ${formatRemainingTime(cooldownRemainingMs)}.`);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    const activeEmail = user?.email || "anonymous@scholar-atlas.com";

    setIsPending(true);
    try {
      const res = await submitFeedback(activeEmail, category, message);
      if (res.success) {
        const now = Date.now();
        localStorage.setItem(LOCAL_STORAGE_KEY, now.toString());
        setCooldownRemainingMs(FEEDBACK_COOLDOWN_MS);
        toast.success("Thank you, Sir! Your feedback has been sent directly to the development team.");
        setIsSubmitted(true);
        setMessage("");
      } else {
        toast.error(res.error || "Failed to send feedback.");
      }
    } catch {
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="bg-bg-base py-16 md:py-24 border-t border-border-strong relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
              <MessageSquare className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">Community Feedback</span>
            </div>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-gray-900 dark:text-white tracking-tight">
              Report Bugs & Request Features
            </h2>
            <p className="text-[15px] sm:text-[16px] text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed font-medium">
              Faced a problem, found a bug or have an idea for a new feature? Tell us about it. Your feedback goes directly to our admin team.
            </p>
          </div>

          {cooldownRemainingMs !== null && cooldownRemainingMs > 0 && !isSubmitted ? (
            <div className="glass-card rounded-[32px] p-8 md:p-12 border border-border-strong dark:border-white/10 bg-bg-surface/80 dark:bg-bg-elevated/80 shadow-xl text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Cooldown Active</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                  Thank you for your response, Sir! To prevent spam, feedback submission is limited to once every 24 hours.
                </p>
              </div>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-lg font-black tracking-wider">
                <Clock className="w-5 h-5" />
                <span>{formatRemainingTime(cooldownRemainingMs)}</span>
              </div>
              <p className="text-xs text-text-tertiary block">
                You will be able to submit new feedback once the timer expires.
              </p>
            </div>
          ) : isSubmitted ? (
            <div className="glass-card rounded-[32px] p-8 md:p-12 border border-border-strong dark:border-white/10 bg-bg-surface/80 dark:bg-bg-elevated/80 shadow-xl text-center py-10 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Received</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Thank you for helping us improve Scholar Atlas. Your note is logged in our admin panel. Feedback submission will enter a 24-hour cooldown period.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-[32px] p-8 md:p-12 border border-border-strong dark:border-white/10 bg-bg-surface/80 dark:bg-bg-elevated/80 shadow-xl">
              <form onSubmit={handleOpenConfirm} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block">
                    Feedback Category
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setCategory("bug")}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                        category === "bug"
                          ? "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400 shadow-sm"
                          : "bg-bg-base border-border-strong text-text-tertiary hover:text-text-primary"
                      }`}
                    >
                      <Bug className="w-4 h-4" />
                      <span>Bug Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory("feature")}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                        category === "feature"
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm"
                          : "bg-bg-base border-border-strong text-text-tertiary hover:text-text-primary"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>New Feature</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory("feedback")}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                        category === "feedback"
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "bg-bg-base border-border-strong text-text-tertiary hover:text-text-primary"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>General</span>
                    </button>
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block">
                    What would you like to report or improve?
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the bug you encountered, the page it happened on or the feature you would love to see..."
                    required
                    className="w-full p-5 rounded-2xl border-2 border-border-strong bg-bg-base font-medium text-text-primary outline-none focus:border-accent transition-all dark:bg-bg-surface resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-accent hover:bg-[#78350f] text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit to Admin
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl bg-bg-surface dark:bg-bg-elevated border border-border-strong p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary rounded-full hover:bg-bg-base transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Submission</h3>
                <p className="text-xs text-text-secondary">Please review before sending to admin team</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-bg-base/80 border border-border-strong space-y-2 text-left">
              <div className="flex items-center justify-between text-xs text-text-tertiary font-medium">
                <span>Category:</span>
                <span className="capitalize font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10">
                  {category}
                </span>
              </div>
              <div className="text-xs text-text-primary font-medium line-clamp-3 italic">
                "{message}"
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-2.5 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>After confirming, you will be restricted from submitting another feedback for 24 hours.</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-border-strong text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-bg-base transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isPending}
                className="flex-1 py-3 px-4 bg-accent hover:bg-[#78350f] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm & Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
