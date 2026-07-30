'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, Trash2, Globe, BookOpen } from 'lucide-react';
import { addHoliday, deleteHoliday } from '@/app/dashboard/attendance/actions';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holidays: any[];
  subjects: any[];
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  holidays,
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'subject'>('global');
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    subjectId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addHoliday({
        name: formData.name,
        date: formData.date,
        scope: activeTab,
        subjectId: activeTab === 'subject' ? formData.subjectId : undefined,
      });
      toast.success('Holiday added successfully');
      setFormData({ ...formData, name: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      toast.success('Holiday removed');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-bg rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh] border-b-8 border-[#92400e]/10"
          >
            <div className="px-10 py-8 border-b border-border-strong flex justify-between items-center bg-white/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#92400e] flex items-center justify-center text-white shadow-lg shadow-[#92400e]/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-ink">Holiday Manager</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-6 h-6 text-ink-3" />
              </button>
            </div>

            <div className="flex border-b border-border-strong">
              <button
                onClick={() => setActiveTab('global')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'global' ? 'text-[#92400e] border-b-2 border-[#92400e]' : 'text-ink-3 hover:text-ink'
                }`}
              >
                Global Holidays
              </button>
              <button
                onClick={() => setActiveTab('subject')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'subject' ? 'text-[#92400e] border-b-2 border-[#92400e]' : 'text-ink-3 hover:text-ink'
                }`}
              >
                Subject Cancellations
              </button>
            </div>

            <div className="px-10 pt-8 -mb-2">
              <p className="text-xs font-medium text-ink-3 leading-relaxed">
                {activeTab === 'global' 
                  ? 'Global holidays apply to all courses across your schedule. Any class scheduled on these dates will be automatically marked as cancelled and will not affect your attendance.'
                  : 'Subject cancellations are specific to a single course (e.g., a professor is absent). Classes for other subjects on this date will proceed as normal.'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white/60 dark:bg-bg-surface/80 rounded-[32px] border border-border-strong">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Holiday Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. National Day"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-border-strong bg-bg-base dark:bg-bg-elevated font-bold text-text-primary outline-none focus:border-accent transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-border-strong bg-bg-base dark:bg-bg-elevated font-bold text-text-primary outline-none focus:border-accent transition-all"
                      required
                    />
                  </div>
                </div>

                {activeTab === 'subject' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Select Subject</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-border-strong bg-bg-base dark:bg-bg-elevated font-bold text-text-primary outline-none focus:border-accent transition-all appearance-none"
                      required
                    >
                      <option value="">Choose a subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-[#92400e] hover:bg-[#78350f] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-[#92400e]/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? 'Processing...' : 'Add to Calendar'}
                </button>
              </form>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-ink-3 uppercase tracking-[0.2em] px-2">Scheduled Items</h4>
                <div className="space-y-3">
                  {holidays.filter(h => h.scope === activeTab).map(holiday => (
                    <div key={holiday.id} className="flex items-center justify-between p-6 bg-white border border-border-strong rounded-[28px] group transition-all hover:shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-stone-50 flex flex-col items-center justify-center border border-border-strong">
                          <span className="text-[10px] font-black text-ink-3 uppercase leading-none mb-1">
                            {format(new Date(holiday.date), 'MMM')}
                          </span>
                          <span className="text-lg font-black text-ink leading-none">
                            {format(new Date(holiday.date), 'dd')}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-ink">{holiday.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {holiday.scope === 'global' ? (
                              <Globe className="w-3 h-3 text-ink-3" />
                            ) : (
                              <BookOpen className="w-3 h-3 text-ink-3" />
                            )}
                            <span className="text-[10px] font-black text-ink-3 uppercase tracking-widest">
                              {holiday.scope === 'global' ? 'Global Holiday' : subjects.find(s => s.id === holiday.subject_id)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(holiday.id)}
                        className="p-3 text-ink-4 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {holidays.filter(h => h.scope === activeTab).length === 0 && (
                    <div className="py-20 text-center">
                      <Calendar className="w-12 h-12 text-ink-4 mx-auto mb-4" />
                      <p className="text-sm font-bold text-ink-3">No {activeTab} dates recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
