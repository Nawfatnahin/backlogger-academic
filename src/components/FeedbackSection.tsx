"use client";

import React, { useState } from "react";
import { MessageSquare, Bug, Sparkles, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSubscription } from "@/components/SubscriptionProvider";
import { submitFeedback } from "@/app/dashboard/admin/actions";
import { toast } from "sonner";

export default function FeedbackSection() {
  const { user } = useSubscription();
  const [category, setCategory] = useState<"bug" | "feature" | "feedback">("bug");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeEmail = user?.email || "anonymous@scholar-atlas.com";
    if (!message.trim()) {
      toast.error("Please enter your message, Sir.");
      return;
    }

    setIsPending(true);
    try {
      const res = await submitFeedback(activeEmail, category, message);
      if (res.success) {
        toast.success("Thank you! Your feedback has been sent directly to the development team.");
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
    <section className="bg-bg-base py-16 md:py-24 border-t border-border-strong">
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

          <div className="glass-card rounded-[32px] p-8 md:p-12 border border-border-strong dark:border-white/10 bg-bg-surface/80 dark:bg-bg-elevated/80 shadow-xl">
            {isSubmitted ? (
              <div className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Received</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  Thank you for helping us improve Scholar Atlas. Your note is logged in our admin panel.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl bg-bg-base border border-border-strong text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all mt-4"
                >
                  Submit Another Response
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
