'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ADMIN_EMAILS, PRO_EMAILS, MAX_FREE_TASKS } from "@/lib/constants";
import { headers } from "next/headers";
import { mutationRateLimit, getIp } from "@/lib/ratelimit";
import { taskSchema } from "@/lib/validations";

export async function addTask(title: string, priority: 'low' | 'medium' | 'high', subjectId?: string, dueDate?: string, colorTag?: string) {
  const headersList = await headers();
  const ip = getIp(headersList);
  const { success } = await mutationRateLimit.limit(ip);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const validation = taskSchema.safeParse({ title, status: 'todo', priority, due_date: dueDate });
  if (!validation.success) throw new Error((validation.error as any).errors[0].message);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) throw new Error("Not authenticated");

  // Check Task Limit for free users
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('email', user.email).maybeSingle();
  const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email) : false;
  const isProHardcoded = user.email ? PRO_EMAILS.includes(user.email) : false;
  
  let isPro = sub?.plan === 'pro' || isProHardcoded;
  if (isPro && sub?.premium_until) {
    if (new Date(sub.premium_until) < new Date()) {
      isPro = false;
    }
  }

  if (!isPro && !isAdmin) {
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id);
    
    if (count !== null && count >= MAX_FREE_TASKS) {
      throw new Error(`Limit reached: You can only have up to ${MAX_FREE_TASKS} total tasks. Upgrade to Pro for unlimited!`);
    }
  }

  const { error } = await supabase.from("tasks").insert({
    title,
    priority,
    subject_id: subjectId || null,
    due_date: dueDate || null,
    user_id: user.id,
    status: 'todo',
    color_tag: colorTag || 'slate',
  });

  if (error) throw error;
  revalidatePath("/dashboard/tasks");
}

export async function updateTaskStatus(id: string, status: 'todo' | 'in-progress' | 'done') {
  const headersList = await headers();
  const ip = getIp(headersList);
  const { success } = await mutationRateLimit.limit(ip);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const validation = taskSchema.pick({ status: true }).safeParse({ status });
  if (!validation.success) throw new Error((validation.error as any).errors[0].message);

  const supabase = await createClient();
  // Security: getUser() verifies session server-side; ownership enforced via user_id filter
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", authData.user.id); // Ownership check
  if (error) throw error;
  revalidatePath("/dashboard/tasks");
}

export async function deleteTask(id: string) {
  const headersList = await headers();
  const ip = getIp(headersList);
  const { success } = await mutationRateLimit.limit(ip);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const supabase = await createClient();
  // Security: getUser() verifies session server-side; ownership enforced via user_id filter
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id); // Ownership check
  if (error) throw error;
  revalidatePath("/dashboard/tasks");
}

export async function updateTask(id: string, updates: { title?: string; priority?: 'low' | 'medium' | 'high'; subjectId?: string | null; dueDate?: string | null; colorTag?: string }) {
  const headersList = await headers();
  const ip = getIp(headersList);
  const { success } = await mutationRateLimit.limit(ip);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Not authenticated");

  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.subjectId !== undefined) updateData.subject_id = updates.subjectId;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
  if (updates.colorTag !== undefined) updateData.color_tag = updates.colorTag;

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", authData.user.id);
    
  if (error) throw error;
  revalidatePath("/dashboard/tasks");
}
