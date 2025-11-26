import React, { useState, useMemo, useEffect } from 'react';
import { DailyTask, DailyStatus } from '../types';
import { Plus, Trash2, Edit2, Save, X, ExternalLink, Archive, CheckCircle2, Clock, Undo2, Download } from 'lucide-react';
import * as Exporter from '../services/exportService';

interface DailyTableProps {
  tasks: DailyTask[];
  onUpdate: (tasks: DailyTask[]) => void;
  // External prop to control view
  externalView?: 'PLANNER' | 'ARCHIVE' | null;
  // New Prop for custom completion logic
  onCompleteTask?: (task: DailyTask) => void;
}

type DailyView = 'PLANNER' | 'ARCHIVE';

const DURATION_OPTIONS = [
  { value: '0m', label: '0 دقيقة' },
  { value: '15m', label: '15 دقيقة' },
  { value: '30m', label: '30 دقيقة' },
  { value: '45m', label: '45 دقيقة' },
  { value: '1h', label: '1 ساعة' },
  { value: '1h 15m', label: '1 ساعة و 15 دقيقة' },
  { value: '1h 30m', label: '1 ساعة و 30 دقيقة' },
  { value: '1h 45m', label: '1 ساعة و 45 دقيقة' },
  { value: '2h', label: '2 ساعة' },
  { value: '2h 15m', label: '2 ساعة و 15 دقيقة' },
  { value: '2h 30m', label: '2 ساعة و 30 دقيقة' },
  { value: '2h 45m', label: '2 ساعة و 45 دقيقة' },
  { value: '3h', label: '3 ساعة' },
  { value: '3h 15m', label: '3 ساعة و 15 دقيقة' },
  { value: '3h 30m', label: '3 ساعة و 30 دقيقة' },
  { value: '3h 45m', label: '3 ساعة و 45 دقيقة' },
  { value: '4h', label: '4 ساعة' },
  { value: '>4h', label: 'أكثر من 4 ساعات' },
];

const DailyTable: React.FC<DailyTableProps> = ({ tasks, onUpdate, externalView, onCompleteTask }) => {
  const [view, setView] = useState<DailyView>('PLANNER');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DailyTask>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<DailyTask>>({
    taskName: '',
    duration: '0m',
    linkNotes: '',
    status: DailyStatus.ONGOING
  });

  // Sync external view prop
  useEffect(() => {
    if (externalView) {
      setView(externalView);
    }
  }, [externalView]);

  // Helper to parse "1h 30m" into minutes
  const parseDuration = (str: string): number => {
    if (!str) return 0;
    if (str === '>4h') return 240; // Handle max value as 4 hours for calculation safety
    
    const hMatch = str.match(/(\d+)\s*h/);
    const mMatch = str.match(/(\d+)\s*m/);
    let minutes = 0;
    if (hMatch) minutes += parseInt(hMatch[1]) * 60;
    if (mMatch) minutes += parseInt(mMatch[1]);
    
    // Fallback for simple numbers assuming minutes
    if (minutes === 0 && !isNaN(Number(str))) minutes = Number(str);
    
    return minutes;
  };

  const formatMinutes = (mins: number) => {
    if (mins === 0) return '0د';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}س ${m}د`;
    if (h > 0) return `${h}س`;
    return `${m}د`;
  };

  // --- Derived Stats ---
  
  const plannerTasks = tasks.filter(t => t.status !== DailyStatus.DONE);
  const archiveTasks = tasks.filter(t => t.status === DailyStatus.DONE);

  const totalPlannedMinutes = useMemo(() => {
    return plannerTasks.reduce((acc, t) => acc + parseDuration(t.duration), 0);
  }, [plannerTasks]);

  const completedTodayMinutes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks
      .filter(t => t.status === DailyStatus.DONE && t.completedDate === today)
      .reduce((acc, t) => acc + parseDuration(t.duration), 0);
  }, [tasks]);

  // --- Actions ---

  const handleDelete = (id: string) => {
    if (window.confirm('هل تريد حذف هذا السجل نهائياً؟')) {
      onUpdate(tasks.filter(t => t.id !== id));
    }
  };

  const handleComplete = (task: DailyTask) => {
    if (onCompleteTask) {
      onCompleteTask(task);
    } else {
      // Fallback behavior
      const updated = tasks.map(t => {
        if (t.id === task.id) {
          return { 
            ...t, 
            status: DailyStatus.DONE, 
            completedDate: new Date().toISOString().split('T')[0] // Mark as completed today
          };
        }
        return t;
      });
      onUpdate(updated);
    }
  };

  const handleRestore = (task: DailyTask) => {
    const updated = tasks.map(t => {
      if (t.id === task.id) {
        // Move back to planner, reset completed date
        const { completedDate, ...rest } = t;
        return { 
          ...rest, 
          status: DailyStatus.ONGOING 
        };
      }
      return t;
    });
    onUpdate(updated);
  };

  const startEdit = (task: DailyTask) => {
    setEditingId(task.id);
    setEditForm({ ...task });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedTasks = tasks.map(t => 
      t.id === editingId ? { ...t, ...editForm } as DailyTask : t
    );
    onUpdate(updatedTasks);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newForm.taskName) return;
    const newTask: DailyTask = {
      id: Math.random().toString(36).substr(2, 9),
      taskName: newForm.taskName!,
      duration: newForm.duration || '0m',
      linkNotes: newForm.linkNotes || '',
      status: newForm.status as DailyStatus,
      completedDate: newForm.status === DailyStatus.DONE ? new Date().toISOString().split('T')[0] : undefined
    };
    onUpdate([newTask, ...tasks]);
    setNewForm({ taskName: '', duration: '0m', linkNotes: '', status: DailyStatus.ONGOING });
    setIsAdding(false);
  };

  const handleExportHistory = () => {
    Exporter.exportDailyHistory(archiveTasks);
  };

  // Group Archive by Date
  const groupedArchive = useMemo(() => {
    const groups: Record<string, { tasks: DailyTask[], totalMinutes: number }> = {};
    
    archiveTasks.forEach(t => {
      const date = t.completedDate || 'تاريخ غير معروف';
      if (!groups[date]) groups[date] = { tasks: [], totalMinutes: 0 };
      groups[date].tasks.push(t);
      groups[date].totalMinutes += parseDuration(t.duration);
    });
    
    // Sort dates descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [archiveTasks]);


  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-8rem)]" dir="rtl">
      
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setView('PLANNER')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            view === 'PLANNER' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          المخطط اليومي ({plannerTasks.length})
        </button>
        <button 
          onClick={() => setView('ARCHIVE')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            view === 'ARCHIVE' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Archive size={16} /> الأرشيف والسجل
        </button>
      </div>

      {/* Summary Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
           <span className="text-slate-500">إجمالي وقت التخطيط:</span>
           <span className="font-bold text-indigo-600 font-mono">{formatMinutes(totalPlannedMinutes)}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-slate-500">ساعات العمل اليوم:</span>
           <span className="font-bold text-emerald-600 font-mono text-lg">{formatMinutes(completedTodayMinutes)}</span>
        </div>
      </div>

      {/* --- PLANNER VIEW --- */}
      {view === 'PLANNER' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-slate-700">التركيز اليومي</h3>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 shadow-sm transition-all"
            >
              <Plus size={16} /> إدخال جديد
            </button>
          </div>

          {isAdding && (
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 grid grid-cols-1 md:grid-cols-12 gap-3 animate-slide-down">
              <div className="md:col-span-5">
                <input 
                  type="text" placeholder="وصف المهمة" className="w-full p-2 border border-indigo-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400"
                  value={newForm.taskName} onChange={e => setNewForm({...newForm, taskName: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="md:col-span-2">
                <select 
                  className="w-full p-2 border border-indigo-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900"
                  value={newForm.duration} 
                  onChange={e => setNewForm({...newForm, duration: e.target.value})}
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <input 
                  type="text" placeholder="روابط / ملاحظات" className="w-full p-2 border border-indigo-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400"
                  value={newForm.linkNotes} onChange={e => setNewForm({...newForm, linkNotes: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="button" onClick={handleAdd} className="flex-1 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">إضافة</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-3 bg-white border border-slate-200 text-slate-500 rounded hover:bg-slate-50"><X size={16}/></button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {plannerTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={48} className="mb-2 opacity-20" />
                <p>كل شيء جاهز! أضف مهام لبدء يومك.</p>
              </div>
            ) : (
              plannerTasks.map(task => (
                <div key={task.id} className="group bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-3 items-center">
                  {editingId === task.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 w-full">
                      <input className="md:col-span-5 border border-indigo-300 rounded p-1.5 outline-none focus:border-indigo-500 bg-white text-slate-900" value={editForm.taskName} onChange={e => setEditForm({...editForm, taskName: e.target.value})} />
                      <select 
                        className="md:col-span-2 border border-indigo-300 rounded p-1.5 outline-none focus:border-indigo-500 bg-white text-slate-900" 
                        value={editForm.duration} 
                        onChange={e => setEditForm({...editForm, duration: e.target.value})}
                      >
                         {DURATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                      </select>
                      <input className="md:col-span-3 border border-indigo-300 rounded p-1.5 outline-none focus:border-indigo-500 bg-white text-slate-900" value={editForm.linkNotes} onChange={e => setEditForm({...editForm, linkNotes: e.target.value})} />
                      <div className="md:col-span-2 flex gap-1 justify-end">
                        <button type="button" onClick={saveEdit} className="text-emerald-600 bg-emerald-50 p-1.5 rounded hover:bg-emerald-100"><Save size={16}/></button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-slate-500 bg-slate-100 p-1.5 rounded hover:bg-slate-200"><X size={16}/></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${task.status === DailyStatus.ONGOING ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                          <span className="font-medium text-slate-800">{task.taskName}</span>
                        </div>
                        {task.linkNotes && (
                           <div className="text-xs text-slate-500 mt-1 mr-4 truncate max-w-md">
                             {task.linkNotes.startsWith('http') ? (
                               <a href={task.linkNotes} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline flex items-center gap-1">
                                 <ExternalLink size={10} /> رابط
                               </a>
                             ) : task.linkNotes}
                           </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex items-center gap-1 text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded min-w-[3rem] justify-center">
                          <Clock size={12} /> {task.duration || '0m'}
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <button 
                             type="button"
                             onClick={() => handleComplete(task)}
                             title="إتمام وأرشفة"
                             className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                           >
                             <CheckCircle2 size={18} />
                           </button>
                           <button 
                             type="button"
                             onClick={() => startEdit(task)} 
                             className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                             title="تعديل"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                             type="button"
                             onClick={() => handleDelete(task.id)} 
                             className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                             title="حذف"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- ARCHIVE VIEW --- */}
      {view === 'ARCHIVE' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
           <div className="flex justify-end mb-2">
             <button 
               onClick={handleExportHistory}
               className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all shadow-sm"
             >
               <Download size={14} /> تصدير السجل (Excel)
             </button>
           </div>
          {groupedArchive.length === 0 ? (
            <div className="text-center py-10 text-slate-400">لا توجد مهام مؤرشفة بعد.</div>
          ) : (
            groupedArchive.map(([date, group]) => (
              <div key={date} className="animate-fade-in bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-3">
                  <h4 className="font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-full text-sm shadow-sm">
                    {date === new Date().toISOString().split('T')[0] ? 'اليوم' : date}
                  </h4>
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    الإجمالي: {formatMinutes(group.totalMinutes)}
                  </span>
                </div>
                
                <div className="space-y-2 pr-2">
                  {group.tasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center text-sm group bg-white p-3 rounded-lg border border-slate-200/60 hover:border-slate-300 transition-all">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-slate-600 line-through decoration-slate-300">{task.taskName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{task.duration}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-r border-slate-100 pr-2 mr-2">
                            <button 
                                type="button"
                                onClick={() => handleRestore(task)} 
                                title="استعادة للمخطط"
                                className="text-slate-400 hover:text-indigo-500 p-1"
                            >
                            <Undo2 size={14} />
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleDelete(task.id)} 
                                title="حذف نهائي"
                                className="text-slate-400 hover:text-red-400 p-1"
                            >
                            <Trash2 size={14} />
                            </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default DailyTable;