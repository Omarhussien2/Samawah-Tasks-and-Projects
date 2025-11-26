import React, { useState, useMemo } from 'react';
import { ProjectTask, ProjectStatus, ProjectPriority } from '../types';
import { Plus, Calendar, Clock, CheckCircle2, AlertCircle, LayoutGrid, X, Trash2, ListPlus } from 'lucide-react';

interface SamawaProjectsProps {
  tasks: ProjectTask[];
  onUpdate: (tasks: ProjectTask[]) => void;
  // New Prop
  onMoveToDaily?: (task: ProjectTask) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  [ProjectPriority.HIGH]: 'bg-red-50 text-red-600 border-red-100',
  [ProjectPriority.MEDIUM]: 'bg-orange-50 text-orange-600 border-orange-100',
  [ProjectPriority.LOW]: 'bg-blue-50 text-blue-600 border-blue-100',
};

const SamawaProjects: React.FC<SamawaProjectsProps> = ({ tasks, onUpdate, onMoveToDaily }) => {
  const [addingTaskToProject, setAddingTaskToProject] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  
  const [newTaskForm, setNewTaskForm] = useState<{name: string, date: string, project: string}>({
    name: '', date: '', project: ''
  });

  // Unique Projects
  const projects = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.projectName))).sort();
  }, [tasks]);

  // Handlers
  const handleQuickAdd = () => {
    if (!newTaskForm.name || !newTaskForm.project) return;
    
    const newTask: ProjectTask = {
      id: Math.random().toString(36).substr(2, 9),
      projectName: newTaskForm.project,
      taskName: newTaskForm.name,
      deliveryDate: newTaskForm.date,
      status: ProjectStatus.PENDING,
      priority: ProjectPriority.MEDIUM
    };

    onUpdate([...tasks, newTask]);
    setNewTaskForm({ name: '', date: '', project: '' });
    setAddingTaskToProject(null);
    setIsAddingProject(false);
  };

  const handleQuickComplete = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: ProjectStatus.COMPLETED } : t);
    onUpdate(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل تريد حذف هذه المهمة؟')) {
       onUpdate(tasks.filter(t => t.id !== id));
    }
  };

  const openAddTask = (projectName: string) => {
    setAddingTaskToProject(projectName);
    setNewTaskForm({ name: '', date: '', project: projectName });
  };

  const getDayDiff = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid className="text-indigo-600" />
            مشاريع سماوة
          </h2>
          <p className="text-slate-500 text-sm">نظرة عامة على البطاقات للمهام النشطة والمتبقية.</p>
        </div>
        <button 
          onClick={() => setIsAddingProject(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 shadow-md transition-all"
        >
          <Plus size={18} /> مشروع جديد
        </button>
      </div>

      {/* New Project Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-bold text-lg mb-4 text-slate-800">إضافة مشروع جديد</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">اسم المشروع</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                  value={newTaskForm.project}
                  onChange={e => setNewTaskForm({...newTaskForm, project: e.target.value})}
                  placeholder="مثال: حملة رمضان"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">المهمة الأولى</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                  value={newTaskForm.name}
                  onChange={e => setNewTaskForm({...newTaskForm, name: e.target.value})}
                  placeholder="اسم المهمة المبدئية"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsAddingProject(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">إلغاء</button>
              <button onClick={handleQuickAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">إنشاء المشروع</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          // Filter tasks: Project match + NOT Completed
          const pendingTasks = tasks
            .filter(t => t.projectName === project && t.status !== ProjectStatus.COMPLETED)
            .sort((a, b) => (a.deliveryDate || '9999').localeCompare(b.deliveryDate || '9999'));

          return (
            <div key={project} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">{project}</h3>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                  {pendingTasks.length} متبقية
                </span>
              </div>

              {/* Tasks List */}
              <div className="p-4 flex-1 space-y-3">
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-200" />
                    <p className="text-sm">لا توجد مهام نشطة!</p>
                  </div>
                ) : (
                  pendingTasks.map(task => {
                    const daysLeft = getDayDiff(task.deliveryDate);
                    const isOverdue = daysLeft !== null && daysLeft < 0;
                    const isToday = daysLeft !== null && daysLeft === 0;

                    return (
                      <div key={task.id} className="group flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:border-indigo-100 transition-colors relative">
                        {/* Status Indicator / Complete Button */}
                        <button 
                          type="button"
                          onClick={() => handleQuickComplete(task.id)}
                          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0
                            ${task.status === ProjectStatus.IN_PROGRESS ? 'border-amber-400 text-amber-500' : 'border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'}
                          `}
                          title="إتمام المهمة"
                        >
                           {task.status === ProjectStatus.IN_PROGRESS && <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 leading-tight mb-1.5 break-words">{task.taskName}</p>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            {task.deliveryDate && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border
                                ${isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 
                                  isToday ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                  'bg-slate-50 text-slate-500 border-slate-100'}
                              `}>
                                <Calendar size={10} />
                                {task.deliveryDate}
                              </span>
                            )}
                            {task.priority && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority === 'High' ? 'عالية' : task.priority === 'Medium' ? 'متوسطة' : 'منخفضة'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions (Visible on Hover) */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 top-2">
                             <button 
                               type="button"
                               onClick={() => onMoveToDaily && onMoveToDaily(task)}
                               className="text-slate-300 hover:text-blue-500 p-0.5"
                               title="نقل للمهام اليومية"
                             >
                               <ListPlus size={14} />
                             </button>
                             <button 
                               type="button"
                               onClick={() => handleDelete(task.id)}
                               className="text-slate-300 hover:text-red-500 p-0.5"
                               title="حذف المهمة"
                             >
                               <Trash2 size={14} />
                             </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Inline Add Task Form */}
                {addingTaskToProject === project ? (
                   <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 animate-fade-in">
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="اسم المهمة..." 
                        className="w-full text-sm p-1.5 border border-indigo-200 rounded mb-2 outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900"
                        value={newTaskForm.name}
                        onChange={e => setNewTaskForm({...newTaskForm, name: e.target.value})}
                        onKeyDown={e => {
                          if(e.key === 'Enter') handleQuickAdd();
                          if(e.key === 'Escape') setAddingTaskToProject(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          className="w-full text-xs p-1.5 border border-indigo-200 rounded outline-none bg-white text-slate-900"
                          value={newTaskForm.date}
                          onChange={e => setNewTaskForm({...newTaskForm, date: e.target.value})}
                        />
                        <button onClick={handleQuickAdd} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs">إضافة</button>
                        <button onClick={() => setAddingTaskToProject(null)} className="bg-white text-slate-500 px-2 py-1 rounded text-xs border border-slate-200"><X size={14}/></button>
                      </div>
                   </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => openAddTask(project)}
                    className="w-full py-2 mt-2 text-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-200 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> إضافة مهمة
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default SamawaProjects;