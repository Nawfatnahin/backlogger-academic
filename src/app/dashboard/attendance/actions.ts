'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateStats, AttendanceRecord, Subject } from "@/lib/attendance/calculator";
import { ADMIN_EMAILS, PRO_EMAILS } from "@/lib/constants";
import { headers } from "next/headers";
import { mutationRateLimit, getIp } from "@/lib/ratelimit";

// --- HELPER FOR RATE LIMITING ---
async function checkRateLimit() {
  const headersList = await headers();
  const ip = getIp(headersList);
  const { success } = await mutationRateLimit.limit(ip);
  if (!success) throw new Error("Too many requests. Please try again later.");
}

// --- SCHEMAS ---


const MarkAttendanceSchema = z.object({
  subjectId: z.string().uuid(),
  absenceType: z.enum(['present', 'unexcused', 'medical', 'excused', 'cancelled']),
  classDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional(),
  confirmed: z.boolean().optional(),
});

const UpsertSubjectScheduleSchema = z.object({
  subjectId: z.string().uuid(),
  requiredThreshold: z.number().min(0).max(100),
  personalTarget: z.number().min(0).max(100).optional().nullable(),
  totalClassesPlanned: z.number().min(1).max(200).optional().nullable(),
  semesterStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  semesterEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  scheduleDays: z.array(z.string()).optional(),
  scheduleTime: z.string().optional().nullable(),
});

const AddHolidaySchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scope: z.enum(['global', 'subject']),
  subjectId: z.string().uuid().optional(),
});

// --- HELPER ---

async function getAuthenticatedUser(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error('Authentication error:', error);
    throw new Error('UNAUTHORIZED: Please ensure you are logged in, Sir.');
  }
  return user;
}

// --- ACTIONS ---

export async function addSubject(data: {
  name: string;
  courseCode?: string;
  requiredThreshold: number;
  personalTarget?: number | null;
  classDays: string[];
  semesterStartDate: string;
  totalWeeks: number;
  pastRecords?: Array<{ classDate: string; absenceType: 'present' | 'unexcused' }>;
}) {
  try {
    await checkRateLimit();
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Enforce 10 subjects limit for free tier
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
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count !== null && count >= 10) {
        throw new Error('Limit reached: Free tier users can only track up to 10 subjects. Upgrade to Pro for unlimited subjects!');
      }
    }


    const payload = {
      name: String(data.name).trim(),
      course_code: data.courseCode ? String(data.courseCode).trim() : null,
      required_threshold: Number(data.requiredThreshold),
      personal_target: data.personalTarget !== null ? Number(data.personalTarget) : null,
      schedule_days: Array.isArray(data.classDays) ? data.classDays : [],
      semester_start_date: data.semesterStartDate,
      total_classes_planned: Number(data.totalWeeks) * (Array.isArray(data.classDays) ? data.classDays.length : 0),
      user_id: user.id,
      color_tag: 'blue'
    };

    console.log('[JARVIS]: Initiating subject creation with payload:', payload);

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[JARVIS]: Supabase Database Anomaly:', error);
      return { success: false, error: `DATABASE_ERROR: ${error.message} (${error.code})` };
    }

    // Insert past records if provided
    if (data.pastRecords && data.pastRecords.length > 0) {
      const recordsToInsert = data.pastRecords.map(r => ({
        subject_id: subject.id,
        user_id: user.id,
        class_date: r.classDate,
        absence_type: r.absenceType,
        note: 'Initialized historical attendance'
      }));

      const { error: recordsError } = await supabase
        .from('attendance_records')
        .insert(recordsToInsert);

      if (recordsError) {
        console.error('[JARVIS]: Failed to insert past records:', recordsError);
      }
    }

    revalidatePath('/dashboard/attendance');
    return { success: true, data: subject };
  } catch (error: any) {
    console.error('[JARVIS]: Server Action Exception:', error);
    return { success: false, error: error.message || 'Internal Server Error' };
  }
}

export async function deleteSubject(id: string) {
  try {
    await checkRateLimit();
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: `DATABASE_ERROR: ${error.message}` };
    }
    
    revalidatePath('/dashboard/attendance');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markAttendance(input: z.infer<typeof MarkAttendanceSchema>) {
  await checkRateLimit();
  const validated = MarkAttendanceSchema.parse(input);
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  // 1. Fetch current data for calculations
  const { data: subjectData, error: subjectError } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', validated.subjectId)
    .single();

  if (subjectError || !subjectData) throw new Error('Subject not found');

  const { data: recordsData, error: recordsError } = await supabase
    .from('attendance_records')
    .select('absence_type, class_date')
    .eq('subject_id', validated.subjectId);

  if (recordsError) throw new Error('Failed to fetch attendance records');

  // 2. Alert Gate Logic (only for absences)
  if (validated.absenceType !== 'present' && !validated.confirmed) {
    const currentRecords: AttendanceRecord[] = recordsData.map(r => ({
      absence_type: r.absence_type as any,
      class_date: r.class_date
    }));

    // Recompute with hypothetical absence
    const hypotheticalRecords: AttendanceRecord[] = [
      ...currentRecords.filter(r => r.class_date !== validated.classDate),
      { absence_type: validated.absenceType, class_date: validated.classDate }
    ];

    const stats = calculateStats(subjectData as any, hypotheticalRecords);

    if (stats.safeSkipsLeft !== null && stats.safeSkipsLeft <= 1) {
      return {
        requiresConfirmation: true,
        alertLevel: stats.safeSkipsLeft === 1 ? 'warning' : 'critical',
        stats
      };
    }
  }

  // 3. Save to database (Upsert)
  const { error: upsertError } = await supabase
    .from('attendance_records')
    .upsert({
      subject_id: validated.subjectId,
      user_id: user.id,
      class_date: validated.classDate,
      absence_type: validated.absenceType,
      note: validated.note || null
    }, { onConflict: 'subject_id, class_date' });

  if (upsertError) throw new Error(`Failed to mark attendance: ${upsertError.message}`);

  revalidatePath('/dashboard/attendance');
  return { success: true };
}

export async function updateAttendanceRecord(input: {
  recordId: string;
  absenceType?: string;
  note?: string;
}) {
  await checkRateLimit();
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  const { error } = await supabase
    .from('attendance_records')
    .update({
      absence_type: input.absenceType,
      note: input.note
    })
    .eq('id', input.recordId)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to update record: ${error.message}`);
  revalidatePath('/dashboard/attendance');
}

export async function bulkMarkAttendance(input: {
  records: Array<{ subjectId: string; classDate: string; absenceType: string; note?: string }>
}) {
  await checkRateLimit();
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  const recordsToUpsert = input.records.map(r => ({
    subject_id: r.subjectId,
    user_id: user.id,
    class_date: r.classDate,
    absence_type: r.absenceType,
    note: r.note || null
  }));

  const { error } = await supabase
    .from('attendance_records')
    .upsert(recordsToUpsert, { onConflict: 'subject_id, class_date' });

  if (error) throw new Error(`Failed to bulk mark attendance: ${error.message}`);
  revalidatePath('/dashboard/attendance');
}

export async function upsertSubjectSchedule(input: z.infer<typeof UpsertSubjectScheduleSchema>) {
  await checkRateLimit();
  const validated = UpsertSubjectScheduleSchema.parse(input);
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  const { error } = await supabase
    .from('subjects')
    .update({
      required_threshold: validated.requiredThreshold,
      personal_target: validated.personalTarget,
      total_classes_planned: validated.totalClassesPlanned,
      semester_start_date: validated.semesterStartDate,
      semester_end_date: validated.semesterEndDate,
      schedule_days: validated.scheduleDays,
      schedule_time: validated.scheduleTime
    })
    .eq('id', validated.subjectId)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to update schedule: ${error.message}`);
  revalidatePath('/dashboard/attendance');
}

export async function addHoliday(input: z.infer<typeof AddHolidaySchema>) {
  await checkRateLimit();
  const validated = AddHolidaySchema.parse(input);
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  const { error } = await supabase
    .from('holidays')
    .insert({
      user_id: user.id,
      name: validated.name,
      date: validated.date,
      scope: validated.scope,
      subject_id: validated.subjectId || null
    });

  if (error) throw new Error(`Failed to add holiday: ${error.message}`);
  revalidatePath('/dashboard/attendance');
}

export async function deleteHoliday(id: string) {
  await checkRateLimit();
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to delete holiday: ${error.message}`);
  revalidatePath('/dashboard/attendance');
}

export async function updateSubject(id: string, data: any) {
  try {
    await checkRateLimit();
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    const { pastRecords, ...subjectData } = data;

    const { error } = await supabase
      .from('subjects')
      .update(subjectData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: `DATABASE_ERROR: ${error.message}` };
    }

    if (pastRecords && Array.isArray(pastRecords)) {
      // Delete old records
      await supabase.from('attendance_records').delete().eq('subject_id', id).eq('user_id', user.id);
      
      if (pastRecords.length > 0) {
        const recordsToInsert = pastRecords.map((r: any) => ({
          subject_id: id,
          user_id: user.id,
          class_date: r.classDate,
          absence_type: r.absenceType,
          note: 'Re-initialized historical attendance'
        }));
        await supabase.from('attendance_records').insert(recordsToInsert);
      }
    }
    
    revalidatePath('/dashboard/attendance');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAttendanceRecord(recordId: string) {
  try {
    await checkRateLimit();
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: `DATABASE_ERROR: ${error.message}` };
    }
    
    revalidatePath('/dashboard/attendance');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal server error' };
  }
}

export async function getTodaysSessions() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return [];

    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    const todayDate = today.toISOString().split('T')[0];

    // Fetch subjects scheduled for today
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('id, name, course_code, schedule_days, schedule_time, attendance_records(absence_type, class_date)')
      .eq('user_id', user.id)
      .contains('schedule_days', [todayName]);

    if (error || !subjects) return [];

    // Map to the ClassSession shape expected by the dashboard
    return subjects.map((s: any) => {
      const todayRecord = s.attendance_records?.find((r: any) => r.class_date === todayDate);
      return {
        id: `${s.id}_${todayDate}`,
        status: todayRecord?.absence_type ?? 'upcoming',
        date: todayDate,
        subjects: {
          name: s.name,
          course_code: s.course_code ?? null,
        }
      };
    });
  } catch {
    return [];
  }
}

export async function updateSessionStatus(
  sessionId: string,
  status: 'present' | 'absent' | 'cancelled' | 'holiday' | 'unexcused'
) {
  // sessionId is in the format `{subjectId}_{date}`
  const lastUnderscore = sessionId.lastIndexOf('_');
  if (lastUnderscore === -1) throw new Error('Invalid session ID format');

  const subjectId = sessionId.substring(0, lastUnderscore);
  const classDate = sessionId.substring(lastUnderscore + 1);

  await checkRateLimit();

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  // Map dashboard status values to attendance record absence_type values
  const absenceTypeMap: Record<string, string> = {
    present: 'present',
    absent: 'unexcused',
    unexcused: 'unexcused',
    cancelled: 'cancelled',
    holiday: 'cancelled',
  };

  const absenceType = absenceTypeMap[status] ?? status;

  const { error } = await supabase
    .from('attendance_records')
    .upsert({
      subject_id: subjectId,
      user_id: user.id,
      class_date: classDate,
      absence_type: absenceType,
    }, { onConflict: 'subject_id, class_date' });

  if (error) throw new Error(`Failed to update session: ${error.message}`);
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/attendance');
}
