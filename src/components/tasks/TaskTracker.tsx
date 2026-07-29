"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Clock, Play, Check, RotateCcw, Edit2, Palette } from "lucide-react";
import { addTask, updateTaskStatus, deleteTask, updateTask } from "@/app/dashboard/tasks/actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  subjects?: { name: string } | null;
  subject_id: string | null;
  color_tag?: string;
}

interface Subject {
  id: string;
  name: string;
}

const TASK_COLORS = [
  { id: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', pickerBg: 'bg-slate-500', darkBg: 'dark:bg-slate-900/40', darkText: 'dark:text-slate-300', darkBorder: 'dark:border-slate-800' },
  { id: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', pickerBg: 'bg-rose-500', darkBg: 'dark:bg-rose-900/40', darkText: 'dark:text-rose-300', darkBorder: 'dark:border-rose-800' },
  { id: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', pickerBg: 'bg-amber-500', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-800' },
  { id: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', pickerBg: 'bg-emerald-500', darkBg: 'dark:bg-emerald-900/40', darkText: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-800' },
  { id: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', pickerBg: 'bg-indigo-500', darkBg: 'dark:bg-indigo-900/40', darkText: 'dark:text-indigo-300', darkBorder: 'dark:border-indigo-800' },
  { id: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', pickerBg: 'bg-cyan-500', darkBg: 'dark:bg-cyan-900/40', darkText: 'dark:text-cyan-300', darkBorder: 'dark:border-cyan-800' },
  { id: 'violet', bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', pickerBg: 'bg-violet-500', darkBg: 'dark:bg-violet-900/40', darkText: 'dark:text-violet-300', darkBorder: 'dark:border-violet-800' },
  { id: 'fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', pickerBg: 'bg-fuchsia-500', darkBg: 'dark:bg-fuchsia-900/40', darkText: 'dark:text-fuchsia-300', darkBorder: 'dark:border-fuchsia-800' },
  { id: 'teal', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', pickerBg: 'bg-teal-500', darkBg: 'dark:bg-teal-900/40', darkText: 'dark:text-teal-300', darkBorder: 'dark:border-teal-800' },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', pickerBg: 'bg-orange-500', darkBg: 'dark:bg-orange-900/40', darkText: 'dark:text-orange-300', darkBorder: 'dark:border-orange-800' },
];

export const getColorConfig = (id?: string) => TASK_COLORS.find(c => c.id === id) || TASK_COLORS[0];

export function TaskTracker({ initialTasks, subjects }: { initialTasks: Task[], subjects: Subject[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newSubject, setNewSubject] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newColor, setNewColor] = useState('slate');
  const [isPending, setIsPending] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsPending(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: newTitle,
          priority: newPriority,
          subjectId: newSubject || null,
          dueDate: newDueDate || null,
          colorTag: newColor
        });
        toast.success("Task updated!");
        setEditingTask(null);
      } else {
        await addTask(newTitle, newPriority, newSubject || undefined, newDueDate || undefined, newColor);
        toast.success("Task added!");
      }
      setNewTitle("");
      setNewSubject("");
      setNewDueDate("");
      setNewColor('slate');
      setIsAdding(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save task";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewPriority(task.priority);
    setNewSubject(task.subject_id || "");
    setNewDueDate(task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : "");
    setNewColor(task.color_tag || 'slate');
    setIsAdding(true);
  };

  const columns: { id: Task['status']; title: string; icon: React.ElementType }[] = [
    { id: 'todo', title: 'To Do', icon: Circle },
    { id: 'in-progress', title: 'In Progress', icon: Clock },
    { id: 'done', title: 'Done', icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 no-tap-highlight text-text-primary">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Task Board</h2>
          <p className="text-text-tertiary text-sm font-medium">Organise your assignments and deadlines.</p>
        </div>
        <button
          onClick={() => {
            if (isAdding && !editingTask) {
              setIsAdding(false);
            } else {
              setEditingTask(null);
              setNewTitle("");
              setNewSubject("");
              setNewDueDate("");
              setNewPriority("medium");
              setNewColor("slate");
              setIsAdding(true);
            }
          }}
          className="flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#78350f] transition-all shadow-lg shadow-accent/20 active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {isAdding && !editingTask ? "Cancel" : "Add Task"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-bg-surface p-6 sm:p-8 rounded-[32px] border border-border-strong shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 dark:bg-bg-elevated">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Task Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong bg-bg-base focus:outline-none focus:border-accent transition-all font-bold text-text-primary dark:bg-bg-surface"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong focus:outline-none focus:border-accent transition-all font-bold appearance-none bg-bg-base text-text-primary dark:bg-bg-surface"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Subject</label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong focus:outline-none focus:border-accent transition-all font-bold appearance-none bg-bg-base text-text-primary dark:bg-bg-surface"
              >
                <option value="">None</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong focus:outline-none focus:border-accent transition-all font-bold bg-bg-base text-text-primary dark:bg-bg-surface"
              />
            </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Task Color
            </label>
            <div className="flex flex-wrap gap-3">
              {TASK_COLORS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setNewColor(color.id)}
                  className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2 ${
                    newColor === color.id 
                      ? 'border-text-primary scale-110 shadow-lg' 
                      : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
                  } ${color.pickerBg}`}
                >
                  {newColor === color.id && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-6 py-3.5 text-xs font-black text-text-tertiary hover:text-text-primary uppercase tracking-widest order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#78350f] transition-all disabled:opacity-50 shadow-lg shadow-accent/10 order-1 sm:order-2"
            >
              {isPending ? (editingTask ? "Updating..." : "Adding...") : (editingTask ? "Save Changes" : "Add Task")}
            </button>
          </div>
        </form>
      )}

      <div className="kanban-scroll items-start">
        {columns.map((col) => (
          <div key={col.id} className="kanban-col flex flex-col gap-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${col.id === 'done' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : col.id === 'in-progress' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-bg-surface text-text-tertiary dark:bg-bg-elevated'}`}>
                  <col.icon className="w-4 h-4" />
                </div>
                <h3 className="font-black text-text-primary uppercase text-[10px] tracking-[0.2em]">{col.title}</h3>
                <span className="bg-bg-surface px-2 py-0.5 rounded-lg border border-border-strong text-text-tertiary text-[10px] font-black dark:bg-bg-elevated">
                  {initialTasks.filter(t => t.status === col.id).length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 min-h-[100px] sm:min-h-[200px]">
              {initialTasks
                .filter(t => t.status === col.id)
                .map((task) => {
                  const colorConf = getColorConfig(task.color_tag);
                  return (
                  <div key={task.id} className={`p-6 rounded-[32px] border-2 shadow-sm group hover:shadow-xl dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-300 ${colorConf.bg} ${colorConf.darkBg} ${colorConf.border} ${colorConf.darkBorder} ${task.status === 'done' ? 'opacity-60 grayscale-[0.3]' : 'hover:-translate-y-1'}`}>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h4 className={`text-base font-bold text-text-primary leading-tight tracking-tight ${task.status === 'done' ? 'line-through' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex gap-1.5 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => {
                             const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';
                             updateTaskStatus(task.id, nextStatus);
                           }}
                           className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation ${
                             task.status === 'todo' ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:text-blue-400' :
                             task.status === 'in-progress' ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white dark:bg-green-900/20 dark:text-green-400' :
                             'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white dark:bg-amber-900/20 dark:text-amber-400'
                           }`}
                         >
                           {task.status === 'todo' && <Play className="w-4 h-4 fill-current" />}
                           {task.status === 'in-progress' && <Check className="w-4 h-4 stroke-[3]" />}
                           {task.status === 'done' && <RotateCcw className="w-4 h-4 stroke-[3]" />}
                         </button>
                         <button 
                           onClick={() => startEditing(task)}
                           className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/50 text-text-secondary hover:text-text-primary hover:bg-white rounded-xl transition-all active:scale-90 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-700 border border-transparent hover:border-border-strong touch-manipulation shadow-sm"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => {
                             if(confirm("Delete task?")) deleteTask(task.id);
                           }}
                           className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-red-50 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all active:scale-90 dark:bg-red-900/20 dark:text-red-400 touch-manipulation"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                      {task.subjects && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-accent-light text-accent px-2.5 py-1.5 rounded-xl border border-accent/10 dark:bg-accent/10 dark:text-accent-amber">
                          {task.subjects.name}
                        </span>
                      )}
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border ${
                        task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30' :
                        task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' :
                        'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
                      }`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-auto ${colorConf.text} ${colorConf.darkText} bg-white/50 dark:bg-zinc-900/50 px-2.5 py-1.5 rounded-xl border ${colorConf.border} ${colorConf.darkBorder}`}>
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                )})}
              
              {initialTasks.filter(t => t.status === col.id).length === 0 && (
                <div className="border-2 border-dashed border-border-subtle rounded-[32px] py-10 text-center bg-bg-surface/30 dark:bg-bg-elevated/30">
                  <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest opacity-40">No Tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
