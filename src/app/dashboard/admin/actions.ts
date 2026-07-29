'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ADMIN_EMAILS } from "@/lib/constants";

// ─────────────────────────────────────────────
// SUBSCRIPTION ACTIONS
// ─────────────────────────────────────────────

export async function getSubscription(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error);
    return null;
  }
  
  return data;
}

export async function getAllSubscriptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all subscriptions:', error);
    return [];
  }
  
  return data;
}

export async function toggleProStatus(email: string, isPro: boolean, durationMonths?: number | null) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Unauthorized');
  }

  let premium_until = null;
  if (isPro && durationMonths) {
    const d = new Date();
    d.setMonth(d.getMonth() + durationMonths);
    premium_until = d.toISOString();
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert({ 
      email: email.toLowerCase(), 
      plan: isPro ? 'pro' : 'free',
      premium_until: premium_until,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

  if (error) {
    console.error('Error toggling pro status:', error);
    throw error;
  }
  
  revalidatePath('/dashboard/admin');
}

export async function deleteSubscription(email: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return { success: false, error: 'Unauthorized user' };
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error deleting subscription:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}

// ─────────────────────────────────────────────
// ACCESS CODE ACTIONS
// ─────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateAccessCode(
  durationDays: number = 3,
  maxUses: number = 20
): Promise<{ success: boolean; code?: string; error?: string; cooldownDaysLeft?: number }> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return { success: false, error: 'Unauthorized' };
    }

    const safeDays = Math.max(1, Math.min(3650, durationDays || 3));
    const safeMaxUses = Math.max(1, Math.min(1000, maxUses || 20));

    // Deactivate all old codes
    await supabase.from('access_codes').update({ is_active: false }).eq('is_active', true);

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + safeDays);

    const { error } = await supabase.from('access_codes').insert({
      code,
      uses_count: 0,
      max_uses: safeMaxUses,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    if (error) {
      console.error('Error inserting access code:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin');
    return { success: true, code };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}

export async function cancelAccessCode(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('access_codes')
      .update({ is_active: false })
      .eq('is_active', true);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}

export async function getActiveCode(): Promise<{
  code?: string;
  usesCount?: number;
  maxUses?: number;
  expiresAt?: string;
  createdAt?: string;
  cooldownDaysLeft?: number;
  canGenerate?: boolean;
} | null> {
  try {
    const supabase = await createClient();

    const { data: activeCodes } = await supabase
      .from('access_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const activeCode = activeCodes?.[0] ?? null;

    // Check cooldown
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const { data: recentCodes } = await supabase
      .from('access_codes')
      .select('created_at')
      .gte('created_at', threeDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    let cooldownDaysLeft = 0;
    let canGenerate = true;
    if (recentCodes && recentCodes.length > 0) {
      const lastCreated = new Date(recentCodes[0].created_at);
      const nextAllowed = new Date(lastCreated);
      nextAllowed.setDate(nextAllowed.getDate() + 3);
      const msLeft = nextAllowed.getTime() - Date.now();
      if (msLeft > 0) {
        cooldownDaysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        canGenerate = false;
      }
    }

    return {
      code: activeCode?.code,
      usesCount: activeCode?.uses_count ?? 0,
      maxUses: activeCode?.max_uses ?? 20,
      expiresAt: activeCode?.expires_at,
      createdAt: activeCode?.created_at,
      cooldownDaysLeft,
      canGenerate,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// WAITLIST ACTIONS
// ─────────────────────────────────────────────

export async function getAllWaitlistUsers(): Promise<{ id: string; email: string; created_at: string }[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching waitlist:', error);
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

export async function addToWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('waitlist')
      .upsert({ email: email.toLowerCase() }, { onConflict: 'email' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ─────────────────────────────────────────────
// PRO ACCESS CODE REDEMPTION
// ─────────────────────────────────────────────

export async function getAllProAccessList(): Promise<{ id: string; email: string; code_used: string; granted_at: string }[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pro_access_list')
      .select('*')
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pro access list:', error);
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

export async function redeemAccessCode(
  code: string,
  email: string
): Promise<{ success: boolean; error?: string; limitReached?: boolean }> {
  try {
    const supabase = await createClient();

    // Verify user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Fetch the active code
    const { data: codeData, error: codeError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .single();

    if (codeError || !codeData) {
      return { success: false, error: 'Invalid or expired code' };
    }

    // Check if code is expired
    if (new Date(codeData.expires_at) < new Date()) {
      return { success: false, error: 'This code has expired' };
    }

    // Check use limit
    if (codeData.uses_count >= codeData.max_uses) {
      return { success: false, limitReached: true, error: 'Code limit reached' };
    }

    // Check if this email already redeemed a code
    const { data: existingRedemption } = await supabase
      .from('pro_access_list')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existingRedemption) {
      // They already have pro access from a code
      return { success: false, error: 'This email has already redeemed a code' };
    }

    // Increment use count
    const { error: updateError } = await supabase
      .from('access_codes')
      .update({ uses_count: codeData.uses_count + 1 })
      .eq('id', codeData.id);

    if (updateError) {
      return { success: false, error: 'Failed to update code usage' };
    }

    // Add to pro access list
    await supabase.from('pro_access_list').insert({
      email: cleanEmail,
      code_used: cleanCode,
    });

    // Grant permanent pro in subscriptions (no expiry)
    await supabase.from('subscriptions').upsert({
      email: cleanEmail,
      plan: 'pro',
      premium_until: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}

// ─────────────────────────────────────────────
// FEEDBACK & BUG SUBMISSIONS
// ─────────────────────────────────────────────

export interface FeedbackSubmission {
  id: string;
  email: string;
  category: string;
  message: string;
  created_at: string;
}

export async function submitFeedback(
  email: string,
  category: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();
    const cleanCategory = category.trim();

    if (!cleanEmail || !cleanMessage) {
      return { success: false, error: 'Email and message are required' };
    }

    const { error } = await supabase.from('feedback_submissions').insert({
      email: cleanEmail,
      category: cleanCategory || 'general',
      message: cleanMessage,
    });

    if (error) {
      console.error('Error inserting feedback:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getAllFeedbackSubmissions(): Promise<FeedbackSubmission[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('feedback_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback submissions:', error);
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

export async function deleteFeedbackSubmission(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('feedback_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
