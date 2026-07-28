'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Check, X, Clock, CalendarX } from 'lucide-react';
import { markAttendance } from '@/app/dashboard/attendance/actions';
import { toast } from 'sonner';

interface TodayScheduleProps {
  subjects: any[];
}

type AttendanceType = 'present' | 'unexcused' | 'cancelled' | 'holiday';

export const TodaySchedule: React.FC<TodayScheduleProps> = ({ subjects }) => {
  const today = new Date();
  const dayName = format(today, 'EEEE');
  const todayStr = format(today, 'yyyy-MM-dd');

  const todaysSubjects = subjects.filter(s => 
    s.schedule_days?.includes(dayName)
  );

  // Initialize selected status per subject from today's existing records
  const [selectedStatus, setSelectedStatus] = useState<Record<string, AttendanceType>>({});

  useEffect(() => {
    const initialMap: Record<string, AttendanceType> = {};
    subjects.forEach(subject => {
      const todayRec = (subject.attendance_records || []).find((r: any) => r.class_date === todayStr);
      if (todayRec) {
        initialMap[subject.id] = todayRec.absence_type as AttendanceType;
      }
    });
    setSelectedStatus(initialMap);
  }, [subjects, todayStr]);

  const handleQuickMark = async (subjectId: string, type: AttendanceType) => {
    setSelectedStatus(prev => ({ ...prev, [subjectId]: type }));
    try {
      const apiType = type === 'holiday' ? 'cancelled' : type;
      const res = await markAttendance({
        subjectId,
        absenceType: apiType,
        classDate: todayStr,
        note: type === 'holiday' ? 'Holiday' : undefined
      });

      if (res.success) {
        toast.success(`Marked as ${type === 'unexcused' ? 'Absent' : type.charAt(0).toUpperCase() + type.slice(1)}`);
      } else if (res.requiresConfirmation) {
        toast.info('Attendance requires confirmation due to threshold warnings');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[40px] p-8 border border-border-strong shadow-[0_20px_50px_rgba(0,0,0,0.04)] mb-10 overflow-hidden relative">
      <div className="relative z-10">
        <h3 className="text-sm font-black text-[#92400e] uppercase tracking-[0.3em] mb-4">
          Today — {format(today, 'EEEE, MMMM do')}
        </h3>

        {todaysSubjects.length === 0 ? (
          <p className="text-ink-3 font-medium">No classes scheduled for today, Sir.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {todaysSubjects.map(subject => {
              const active = selectedStatus[subject.id];

              return (
                <div 
                  key={subject.id}
                  className="bg-white border border-border-strong rounded-3xl p-6 flex flex-col gap-4 min-w-[260px] shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
                >
                  <div>
                    <h4 className="font-bold text-ink mb-1">{subject.name}</h4>
                    <p className="text-xs text-ink-3 font-bold uppercase tracking-wider">
                      {subject.schedule_time || 'No time set'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    {/* Present Option */}
                    <button 
                      onClick={() => handleQuickMark(subject.id, 'present')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                        active === 'present'
                          ? "bg-green-600 text-white border-2 border-green-400 shadow-[0_0_18px_rgba(34,197,94,0.75)] ring-2 ring-green-400/50 scale-[1.02] z-10"
                          : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30 hover:bg-green-100"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Present</span>
                    </button>

                    {/* Absent Option */}
                    <button 
                      onClick={() => handleQuickMark(subject.id, 'unexcused')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                        active === 'unexcused'
                          ? "bg-red-600 text-white border-2 border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.75)] ring-2 ring-red-400/50 scale-[1.02] z-10"
                          : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30 hover:bg-red-100"
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Absent</span>
                    </button>

                    {/* Cancelled Option */}
                    <button 
                      onClick={() => handleQuickMark(subject.id, 'cancelled')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                        active === 'cancelled'
                          ? "bg-amber-600 text-white border-2 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.75)] ring-2 ring-amber-400/50 scale-[1.02] z-10"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30 hover:bg-amber-100"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Cancelled</span>
                    </button>

                    {/* Holiday Option */}
                    <button 
                      onClick={() => handleQuickMark(subject.id, 'holiday')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                        active === 'holiday'
                          ? "bg-blue-600 text-white border-2 border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.75)] ring-2 ring-blue-400/50 scale-[1.02] z-10"
                          : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30 hover:bg-blue-100"
                      }`}
                    >
                      <CalendarX className="w-3.5 h-3.5" />
                      <span>Holiday</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
