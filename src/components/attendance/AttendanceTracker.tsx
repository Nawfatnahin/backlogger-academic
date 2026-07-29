'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  Layout, 
  BookOpen, 
  AlertCircle,
  Hash,
  Info,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { calculateStats } from '@/lib/attendance/calculator';
import { SubjectCard } from './SubjectCard';
import { TodaySchedule } from './TodaySchedule';
import { HolidayModal } from './HolidayModal';
import { addSubject, updateSubject } from '@/app/dashboard/attendance/actions';

interface AttendanceTrackerProps {
  initialSubjects: any[];
  initialHolidays: any[];
}

function getClassesCountBetween(startDateStr: string, endDate: Date, classDays: string[]): number {
  if (!startDateStr || classDays.length === 0) return 0;
  const start = new Date(startDateStr);
  if (start >= endDate) return 0;
  
  let count = 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const current = new Date(start.getTime());
  while (current < endDate) {
    const dayName = dayNames[current.getDay()];
    if (classDays.includes(dayName)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getPastClassDates(startDateStr: string, endDate: Date, classDays: string[]): string[] {
  if (!startDateStr || classDays.length === 0) return [];
  const start = new Date(startDateStr);
  const dates: string[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const current = new Date(start.getTime());
  while (current < endDate) {
    const dayName = dayNames[current.getDay()];
    if (classDays.includes(dayName)) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function AttendanceTracker({ initialSubjects, initialHolidays }: AttendanceTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    courseCode: '',
    personalTarget: 75,
    classDays: [] as string[],
    semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
    totalWeeks: 15,
  });
  const [attendedPastClasses, setAttendedPastClasses] = useState<number | ''>('');
  const [cancelledPastClasses, setCancelledPastClasses] = useState<number | ''>('');

  const subjectsWithStats = useMemo(() => {
    return initialSubjects.map(subject => {
      const records = subject.attendance_records || [];
      const stats = calculateStats(subject, records);
      return { subject, stats };
    });
  }, [initialSubjects]);

  const overallHealth = useMemo(() => {
    if (subjectsWithStats.length === 0) return 0;
    const totalAttended = subjectsWithStats.reduce((sum, s) => sum + s.stats.attended, 0);
    const totalClasses = subjectsWithStats.reduce((sum, s) => sum + s.stats.totalClasses, 0);
    return totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 100;
  }, [subjectsWithStats]);

  const subjectsNeedingAttention = subjectsWithStats.filter(
    s => s.stats.healthStatus === 'caution' || s.stats.healthStatus === 'danger'
  ).length;

  const criticalSubjects = subjectsWithStats.filter(
    s => s.stats.healthStatus === 'unreachable'
  ).length;

  const pastClassesCount = useMemo(() => {
    return getClassesCountBetween(formData.semesterStartDate, new Date(), formData.classDays);
  }, [formData.semesterStartDate, formData.classDays]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.classDays.length === 0) {
      toast.error("Please fill all required fields, Sir.");
      return;
    }
    setIsPending(true);
    try {
      if (editingSubject) {
        console.log('[JARVIS]: Dispatching subject update to server...');
        
        let pastRecords = undefined;
        if (attendedPastClasses !== '' || cancelledPastClasses !== '') {
          pastRecords = [] as Array<{ classDate: string; absenceType: 'present' | 'unexcused' | 'cancelled' }>;
          const pastClassDates = getPastClassDates(formData.semesterStartDate, new Date(), formData.classDays);
          if (pastClassDates.length > 0) {
            pastClassDates.sort();
            const attendedCount = attendedPastClasses === '' ? 0 : (attendedPastClasses as number);
            const cancelledCount = cancelledPastClasses === '' ? 0 : (cancelledPastClasses as number);
            for (let i = 0; i < pastClassDates.length; i++) {
              let type: 'present' | 'unexcused' | 'cancelled' = 'unexcused';
              if (i < cancelledCount) {
                type = 'cancelled';
              } else if (i < cancelledCount + attendedCount) {
                type = 'present';
              }
              pastRecords.push({
                classDate: pastClassDates[i],
                absenceType: type
              });
            }
          }
        }

        const res = await updateSubject(editingSubject.id, {
          name: formData.name,
          course_code: formData.courseCode ? String(formData.courseCode).trim() : null,
          required_threshold: Number(formData.personalTarget),
          personal_target: Number(formData.personalTarget),
          schedule_days: formData.classDays,
          semester_start_date: formData.semesterStartDate,
          total_classes_planned: Number(formData.totalWeeks) * formData.classDays.length,
          pastRecords
        });

        if (res.success) {
          setIsAdding(false);
          setEditingSubject(null);
          setFormData({
            name: '',
            courseCode: '',
            personalTarget: 75,
            classDays: [],
            semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
            totalWeeks: 15,
          });
          setAttendedPastClasses('');
          setCancelledPastClasses('');
          toast.success("Subject settings updated with precision, Sir.");
        } else {
          toast.error(`Update Failed: ${res.error}`);
        }
      } else {
        console.log('[JARVIS]: Dispatching subject configuration to server...');
        
        // Generate past records if starting in the past
        const pastRecords: Array<{ classDate: string; absenceType: 'present' | 'unexcused' | 'cancelled' }> = [];
        const pastClassDates = getPastClassDates(formData.semesterStartDate, new Date(), formData.classDays);
        if (pastClassDates.length > 0) {
          // Sort chronologically
          pastClassDates.sort();
          // First N are cancelled, next M are present, remaining are unexcused
          const attendedCount = attendedPastClasses === '' ? 0 : attendedPastClasses;
          const cancelledCount = cancelledPastClasses === '' ? 0 : cancelledPastClasses;
          for (let i = 0; i < pastClassDates.length; i++) {
            let type: 'present' | 'unexcused' | 'cancelled' = 'unexcused';
            if (i < cancelledCount) {
              type = 'cancelled';
            } else if (i < cancelledCount + attendedCount) {
              type = 'present';
            }
            pastRecords.push({
              classDate: pastClassDates[i],
              absenceType: type
            });
          }
        }

        const res = await addSubject({
          name: formData.name,
          courseCode: formData.courseCode,
          requiredThreshold: Number(formData.personalTarget),
          personalTarget: Number(formData.personalTarget),
          classDays: formData.classDays,
          semesterStartDate: formData.semesterStartDate,
          totalWeeks: Number(formData.totalWeeks),
          pastRecords
        });

        if (res.success) {
          setIsAdding(false);
          setEditingSubject(null);
          setFormData({
            name: '',
            courseCode: '',
            personalTarget: 75,
            classDays: [],
            semesterStartDate: format(new Date(), 'yyyy-MM-dd'),
            totalWeeks: 15,
          });
          setAttendedPastClasses('');
          setCancelledPastClasses('');
          toast.success("Academic track initialized with absolute precision, Sir.");
        } else {
          console.error('[JARVIS]: Server Action reported failure:', res.error);
          toast.error(`Configuration Failed: ${res.error}`);
        }
      }
    } catch (error: any) {
      console.error('[JARVIS]: Unexpected network or runtime exception:', error);
      toast.error(`System Anomaly: ${error.message || 'Unknown network error'}`);
    } finally {
      setIsPending(false);
    }
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      courseCode: subject.course_code || '',
      personalTarget: subject.personal_target ?? subject.required_threshold,
      classDays: subject.schedule_days || [],
      semesterStartDate: subject.semester_start_date || format(new Date(), 'yyyy-MM-dd'),
      totalWeeks: Math.round((subject.total_classes_planned || 0) / (subject.schedule_days?.length || 1)) || 15,
    });
    setAttendedPastClasses('');
    setCancelledPastClasses('');
  };

  return (
    <div className="space-y-10 pb-32 text-text-primary">
      {/* Semester Health Score Header */}
      <div className="bg-bg-surface/70 backdrop-blur-xl rounded-[44px] p-8 border border-border-strong shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:bg-bg-elevated/70">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-accent uppercase tracking-[0.3em]">Semester Health</h3>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-black tracking-tighter ${
                overallHealth >= 75 ? 'text-green-600 dark:text-green-400' : overallHealth >= 65 ? 'text-amber-600 dark:text-[#C9831A]' : 'text-red-600 dark:text-[#DC5050]'
              }`}>
                {overallHealth.toFixed(1)}%
              </span>
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Overall Average</span>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none p-4 rounded-3xl bg-bg-base border border-border-strong dark:bg-bg-surface">
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Attention</p>
              <p className="text-2xl font-black text-amber-600 dark:text-[#C9831A]">{subjectsNeedingAttention}</p>
            </div>
            <div className="flex-1 md:flex-none p-4 rounded-3xl bg-bg-base border border-border-strong dark:bg-bg-surface">
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Critical</p>
              <p className="text-2xl font-black text-red-600 dark:text-[#DC5050]">{criticalSubjects}</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs font-medium text-text-tertiary italic">
          * Weighted by class count (subjects with more classes count more)
        </p>
      </div>

      {/* Today's Schedule */}
      <TodaySchedule subjects={initialSubjects} />

      {/* Main Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Your Courses</h2>
          <p className="text-text-tertiary font-medium text-sm sm:text-base">Monitoring {initialSubjects.length} active academic tracks.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsHolidayModalOpen(true)}
            className="flex items-center gap-3 bg-accent/10 text-accent px-6 py-4 rounded-[20px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all active:scale-95"
          >
            <Calendar className="w-5 h-5" />
            Holidays
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-[20px] font-black uppercase tracking-widest hover:-translate-y-1 transition-all active:scale-95 shadow-xl shadow-accent/20"
          >
            <Plus className="w-5 h-5" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Subject Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjectsWithStats.map(({ subject, stats }) => (
          <SubjectCard 
            key={subject.id} 
            subject={subject} 
            stats={stats}
            onEdit={handleEditSubject}
          />
        ))}
      </div>

      {/* Empty State */}
      {initialSubjects.length === 0 && (
        <div className="py-32 text-center bg-bg-surface/50 backdrop-blur-xl rounded-[60px] border-4 border-dashed border-border-strong flex flex-col items-center justify-center dark:bg-bg-elevated/50">
          <BookOpen className="w-16 h-16 text-accent/30 mb-6" />
          <h3 className="text-2xl font-black text-text-primary mb-2">Academic Void Detected</h3>
          <p className="text-text-tertiary font-medium max-w-sm mb-10">Initialize your first course tracking module to begin precision monitoring.</p>
          <button onClick={() => setIsAdding(true)} className="bg-accent text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 active:scale-95 hover:-translate-y-1 transition-all">
            Initialize Track
          </button>
        </div>
      )}

      {/* Modals & Footers */}
      <HolidayModal 
        isOpen={isHolidayModalOpen} 
        onClose={() => setIsHolidayModalOpen(false)}
        holidays={initialHolidays}
        subjects={initialSubjects}
      />

      {/* Add/Edit Subject Modal */}
      {(isAdding || editingSubject) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleAddSubject} className="relative w-full max-w-2xl bg-bg-base rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[85vh] border-b-8 border-accent/10 dark:bg-bg-surface">
            <div className="px-5 sm:px-10 py-5 sm:py-8 border-b border-border-strong flex justify-between items-center bg-bg-surface/50 dark:bg-bg-elevated/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-text-primary">
                  {editingSubject ? "Rename & Edit Course" : "New Monitoring Track"}
                </h3>
              </div>
              <button type="button" onClick={() => { setIsAdding(false); setEditingSubject(null); }} className="p-2 hover:bg-bg-surface rounded-xl transition-colors dark:hover:bg-bg-elevated">
                <X className="w-6 h-6 text-text-tertiary" />
              </button>
            </div>

            <div className="p-5 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2"><Info className="w-3 h-3" /> Subject Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Data Structures" className="w-full px-6 py-4 rounded-2xl border-2 border-border-strong bg-bg-base font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-bg-elevated" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2"><Hash className="w-3 h-3" /> Course Code</label>
                  <input type="text" value={formData.courseCode} onChange={(e) => setFormData({...formData, courseCode: e.target.value})} placeholder="Optional" className="w-full px-6 py-4 rounded-2xl border-2 border-border-strong bg-bg-base font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-bg-elevated" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Active Schedule Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <button key={day} type="button" onClick={() => {
                      const days = formData.classDays.includes(day) ? formData.classDays.filter(d => d !== day) : [...formData.classDays, day];
                      setFormData({...formData, classDays: days});
                    }} className={`px-5 py-3 rounded-xl text-[11px] font-black transition-all border-b-4 ${formData.classDays.includes(day) ? 'bg-accent text-white border-[#78350f] shadow-lg shadow-accent/20' : 'bg-bg-base text-text-tertiary border-border-strong hover:text-text-primary hover:bg-bg-surface dark:bg-bg-elevated dark:hover:bg-bg-base'}`}>{day.slice(0, 3).toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2"><Layout className="w-3 h-3" /> Target Attendance %</label>
                  <input type="number" value={formData.personalTarget} onChange={(e) => setFormData({...formData, personalTarget: parseFloat(e.target.value)})} placeholder="75" className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong bg-bg-base font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-bg-elevated" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Total Planned</label>
                  <input type="number" value={formData.totalWeeks * formData.classDays.length} readOnly className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong bg-bg-surface font-bold text-text-tertiary cursor-not-allowed dark:bg-bg-elevated dark:opacity-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Start Date</label>
                  <input type="date" value={formData.semesterStartDate} onChange={(e) => setFormData({...formData, semesterStartDate: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong bg-bg-base font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-bg-elevated" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Semester Duration (Weeks)</label>
                  <input type="number" value={formData.totalWeeks} onChange={(e) => setFormData({...formData, totalWeeks: parseInt(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl border-2 border-border-strong bg-bg-base font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-bg-elevated" required />
                </div>
              </div>

              {/* Historical Class Input */}
              {pastClassesCount > 0 && (
                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-[#C9831A] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Course Already In Progress</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        Based on your start date of <span className="font-black">{formData.semesterStartDate}</span>, 
                        approximately <span className="font-black">{pastClassesCount}</span> class sessions should have occurred so far.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest">Classes Attended</label>
                      <input 
                        type="number" 
                        min={0} 
                        max={pastClassesCount - (cancelledPastClasses || 0)} 
                        value={attendedPastClasses} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setAttendedPastClasses('');
                          } else {
                            const parsed = parseInt(val);
                            if (!isNaN(parsed)) {
                              setAttendedPastClasses(Math.min(pastClassesCount - (cancelledPastClasses || 0), Math.max(0, parsed)));
                            }
                          }
                        }}
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-300 bg-white font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-zinc-900 dark:border-zinc-800" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest">Cancelled/Holidays</label>
                      <input 
                        type="number" 
                        min={0} 
                        max={pastClassesCount - (attendedPastClasses || 0)} 
                        value={cancelledPastClasses} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setCancelledPastClasses('');
                          } else {
                            const parsed = parseInt(val);
                            if (!isNaN(parsed)) {
                              setCancelledPastClasses(Math.min(pastClassesCount - (attendedPastClasses || 0), Math.max(0, parsed)));
                            }
                          }
                        }}
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-300 bg-white font-bold text-text-primary outline-none focus:border-accent transition-all dark:bg-zinc-900 dark:border-zinc-800" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-10 py-5 sm:py-8 bg-bg-surface/50 border-t border-border-strong flex justify-end gap-4 dark:bg-bg-elevated/50 safe-area-bottom">
              <button type="button" onClick={() => { setIsAdding(false); setEditingSubject(null); }} className="px-8 py-4 text-xs font-black text-text-tertiary hover:text-text-primary uppercase tracking-widest transition-colors">Cancel</button>
              <button type="submit" disabled={isPending} className="bg-accent text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-[#78350f] transition-all disabled:opacity-50 shadow-xl shadow-accent/20 active:scale-95">{isPending ? "Configuring..." : (editingSubject ? "Update Track" : "Initialize Track")}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
