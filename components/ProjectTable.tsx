import React, { useState, useMemo, useEffect } from 'react';
import { ProjectTask, ProjectStatus, ProjectPriority } from '../types';
import { Plus, Trash2, Edit2, Save, X, FileText, Filter, ArrowUpDown, Search, RefreshCw, ListPlus } from 'lucide-react';

interface ProjectTableProps {
  tasks: ProjectTask[];
  onUpdate: (tasks: ProjectTask[]) => void;
  // External props for controlled filtering
  externalFilterStatus?: string;
  externalFilterProject?: string;
  // New Prop
  onMoveToDaily?: (task: ProjectTask) => void;
}

// Arabic Mappings
const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [ProjectPriority.HIGH]: 'عالية',
  [ProjectPriority.MEDIUM]: 'متوسطة',
  [ProjectPriority.LOW]: 'منخفضة'
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PENDING]: 'قيد الانتظار',
  [ProjectStatus.IN_PROGRESS]: 'جاري العمل',
  [ProjectStatus.COMPLETED]: 'مكتمل'
};

type SortOption = 'DATE' | 'PRIORITY';

const ProjectTable: React.FC<ProjectTableProps> = ({ tasks, onUpdate, externalFilterStatus, externalFilterProject, onMoveToDaily }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectTask>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  
  // Filter & Sort State
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DATE');
  
  // Sync External Props with Internal State
  useEffect(() => {
    if (externalFilterStatus) {
      setFilterStatus(externalFilterStatus);
    }
    if (externalFilterProject) {
      setFilterProject(externalFilterProject);
    }
    // If both are reset (e.g. user clicked 'Total Tasks'), reset both
    if (externalFilterStatus === 'ALL' && externalFilterProject === 'ALL') {
      setFilterStatus('ALL');
      setFilterProject('ALL');
    }
  }, [externalFilterStatus, externalFilterProject]);

  // New Task State
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<ProjectTask>>({
    projectName: '',
    taskName: '',
    deliveryDate: '',
    status: ProjectStatus.PENDING,
    priority: ProjectPriority.MEDIUM,
    notes: ''
  });

  // Get Unique Projects for Dropdown
  const allProjectNames = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.projectName))).sort();
  }, [tasks]);

  // --- Logic: Filter then Group then Sort ---
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterProject !== 'ALL' && task.projectName !== filterProject) return false;
      if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
      if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterProject, filterStatus, filterPriority]);

  const groupedAndSortedTasks = useMemo(() => {
    const groups: Record<string, ProjectTask[]> = {};
    
    // Grouping
    filteredTasks.forEach(task => {
      if (!groups[task.projectName]) groups[task.projectName] = [];
      groups[task.projectName].push(task);
    });

    // Sorting within groups
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (sortBy === 'DATE') {
          // Date Ascending (Empty dates last)
          if (!a.deliveryDate && !b.deliveryDate) return 0;
          if (!a.deliveryDate) return 1;
          if (!b.deliveryDate) return -1;
          return a.deliveryDate.localeCompare(b.deliveryDate);
        } else {
          // Priority High to Low
          const priorityWeight = { [ProjectPriority.HIGH]: 3, [ProjectPriority.MEDIUM]: 2, [ProjectPriority.LOW]: 1 };
          const pA = priorityWeight[a.priority || ProjectPriority.MEDIUM];
          const pB = priorityWeight[b.priority || ProjectPriority.MEDIUM];
          return pB - pA; // Descending
        }
      });
    });

    return groups;
  }, [filteredTasks, sortBy]);

  const displayedProjects = Object.keys(groupedAndSortedTasks).sort();

  // --- Handlers ---

  const handleInlineUpdate = (id: string, field: keyof ProjectTask, value: any) => {
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
    onUpdate(updatedTasks);
  };

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) {
      onUpdate(tasks.filter(t => t.id !== id));
    }
  };

  const startEdit = (task: ProjectTask) => {
    setEditingId(task.id);
    setEditForm({ ...task });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updatedTasks = tasks.map(t => 
      t.id === editingId ? { ...t, ...editForm } as ProjectTask : t
    );
    onUpdate(updatedTasks);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newForm.projectName || !newForm.taskName) return;
    const newTask: ProjectTask = {
      id: Math.random().toString(36).substr(2, 9),
      projectName: newForm.projectName!,
      taskName: newForm.taskName!,
      deliveryDate: newForm.deliveryDate || '',
      status: newForm.status as ProjectStatus,
      priority: (newForm.priority as ProjectPriority) || ProjectPriority.MEDIUM,
      notes: newForm.notes || ''
    };
    onUpdate([newTask, ...tasks]);
    setNewForm({ projectName: '', taskName: '', deliveryDate: '', status: ProjectStatus.PENDING, priority: ProjectPriority.MEDIUM, notes: '' });
    setIsAdding(false);
  };

  const resetFilters = () => {
    setFilterProject('ALL');
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setSortBy('DATE');
  };

  // Styling Helpers
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case ProjectStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700 border-amber-200';
      case ProjectStatus.PENDING: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority?: ProjectPriority) => {
    switch (priority) {
      case ProjectPriority.HIGH: return 'bg-red-50 text-red-600 border-red-100 ring-red-200';
      case ProjectPriority.MEDIUM: return 'bg-orange-50 text-orange-600 border-orange-100 ring-orange-200';
      case ProjectPriority.LOW: return 'bg-blue-50 text-blue-600 border-blue-100 ring-blue-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مساحة عمل المشاريع</h2>
          <p className="text-slate-500 text-sm">إدارة ومتابعة المهام حسب المشروع</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 shadow-md transition-all"
        >
          <Plus size={18} /> إضافة مهمة جديدة
        </button>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm ml-2">
            <Filter size={16} /> تصفية:
          </div>
          
          <select 
            value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          >
            <option value="ALL">جميع المشاريع</option>
            {allProjectNames.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          >
            <option value="ALL">جميع الحالات</option>
            {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <select 
            value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          >
            <option value="ALL">جميع الأولويات</option>
            {Object.values(ProjectPriority).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>

          {(filterProject !== 'ALL' || filterStatus !== 'ALL' || filterPriority !== 'ALL') && (
            <button onClick={resetFilters} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50" title="إلغاء التصفيات">
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-r border-slate-100 pt-3 lg:pt-0 lg:pr-4">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm ml-2">
            <ArrowUpDown size={16} /> ترتيب حسب:
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setSortBy('DATE')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === 'DATE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              التاريخ
            </button>
            <button 
              onClick={() => setSortBy('PRIORITY')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === 'PRIORITY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              الأولوية
            </button>
          </div>
        </div>
      </div>

      {/* Add New Task Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 mb-8 animate-slide-down">
          <h3 className="font-semibold text-slate-700 mb-4">إنشاء مهمة جديدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">اسم المشروع</label>
              <input 
                type="text" list="projects-list" placeholder="مثال: هدنة" className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                value={newForm.projectName} onChange={e => setNewForm({...newForm, projectName: e.target.value})}
              />
              <datalist id="projects-list">
                {allProjectNames.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-medium text-slate-500">تفاصيل المهمة</label>
              <input 
                type="text" placeholder="ما الذي يجب إنجازه؟" className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                value={newForm.taskName} onChange={e => setNewForm({...newForm, taskName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">تاريخ التسليم</label>
              <input 
                type="date" className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right text-slate-900"
                value={newForm.deliveryDate} onChange={e => setNewForm({...newForm, deliveryDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">الأولوية</label>
              <select 
                 className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                 value={newForm.priority} onChange={e => setNewForm({...newForm, priority: e.target.value as ProjectPriority})}
              >
                {Object.values(ProjectPriority).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div className="space-y-1 lg:col-span-3">
              <label className="text-xs font-medium text-slate-500">ملاحظات / روابط (اختياري)</label>
              <input 
                type="text" placeholder="أضف تفاصيل إضافية..." className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                value={newForm.notes} onChange={e => setNewForm({...newForm, notes: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">إلغاء</button>
            <button onClick={handleAdd} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">حفظ المهمة</button>
          </div>
        </div>
      )}

      {/* Project Cards */}
      <div className="grid grid-cols-1 gap-8">
        {displayedProjects.map(projectName => {
          const projectTasks = groupedAndSortedTasks[projectName] || [];
          const progress = projectTasks.length > 0 
            ? Math.round((projectTasks.filter(t => t.status === ProjectStatus.COMPLETED).length / projectTasks.length) * 100) 
            : 0;
          
          return (
            <div key={projectName} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              {/* Project Header */}
              <div className="bg-slate-50/80 p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {projectName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{projectName}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{projectTasks.length} مهام</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className={progress === 100 ? "text-emerald-600 font-medium" : ""}>{progress}% مكتمل</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Task Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                      <th className="px-6 py-3 w-12 text-center">#</th>
                      <th className="px-6 py-3">تفاصيل المهمة</th>
                      <th className="px-6 py-3 w-40">الأولوية</th>
                      <th className="px-6 py-3 w-48">تاريخ التسليم</th>
                      <th className="px-6 py-3 w-44">الحالة</th>
                      <th className="px-6 py-3 w-36 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projectTasks.map((task, idx) => (
                      <React.Fragment key={task.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-slate-400 text-sm font-mono align-middle text-center">{idx + 1}</td>
                        
                        {editingId === task.id ? (
                          // Text Edit Mode (Name & Notes)
                          <>
                            <td className="px-6 py-4" colSpan={4}>
                              <div className="space-y-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs text-slate-400">اسم المهمة</label>
                                  <input 
                                    type="text" className="w-full p-2 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" 
                                    value={editForm.taskName} onChange={e => setEditForm({...editForm, taskName: e.target.value})} 
                                    autoFocus
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs text-slate-400">الملاحظات</label>
                                  <input 
                                    type="text" placeholder="ملاحظات..." className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" 
                                    value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-middle text-left">
                              <div className="flex justify-end gap-1">
                                <button onClick={saveEdit} className="p-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="حفظ"><Save size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200" title="إلغاء"><X size={16} /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // View Mode with Inline Editors for Priority, Date, Status
                          <>
                            <td className="px-6 py-4 align-middle">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${task.status === ProjectStatus.COMPLETED ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {task.taskName}
                                  </span>
                                  {task.notes && (
                                    <button onClick={() => toggleNote(task.id)} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="عرض الملاحظات">
                                      <FileText size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                            
                            {/* Inline Priority Edit */}
                            <td className="px-6 py-4 align-middle">
                              <select
                                value={task.priority || ProjectPriority.MEDIUM}
                                onChange={(e) => handleInlineUpdate(task.id, 'priority', e.target.value)}
                                className={`w-full text-xs font-medium px-2 py-1.5 rounded cursor-pointer outline-none border hover:border-slate-300 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none ${getPriorityColor(task.priority)}`}
                              >
                                {Object.values(ProjectPriority).map(p => (
                                  <option key={p} value={p} className="bg-white text-slate-900">{PRIORITY_LABELS[p]}</option>
                                ))}
                              </select>
                            </td>

                            {/* Inline Date Edit */}
                            <td className="px-6 py-4 align-middle">
                              <div className="relative group/date">
                                <input 
                                  type="date" 
                                  value={task.deliveryDate || ''} 
                                  onChange={(e) => handleInlineUpdate(task.id, 'deliveryDate', e.target.value)}
                                  className={`w-full text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white outline-none py-1 transition-colors ${
                                    task.deliveryDate && new Date(task.deliveryDate) < new Date() && task.status !== ProjectStatus.COMPLETED 
                                      ? 'text-red-600 font-bold' 
                                      : 'text-slate-700'
                                  }`}
                                />
                                {!task.deliveryDate && (
                                  <span className="absolute inset-0 flex items-center text-slate-300 text-xs pointer-events-none group-hover/date:hidden">
                                    حدد تاريخ
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Inline Status Edit */}
                            <td className="px-6 py-4 align-middle">
                              <select
                                value={task.status}
                                onChange={(e) => handleInlineUpdate(task.id, 'status', e.target.value)}
                                className={`w-full px-2 py-1 rounded-full text-xs font-medium cursor-pointer outline-none border hover:border-slate-300 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none ${getStatusColor(task.status)}`}
                              >
                                {Object.values(ProjectStatus).map(s => (
                                  <option key={s} value={s} className="bg-white text-slate-900">{STATUS_LABELS[s]}</option>
                                ))}
                              </select>
                            </td>

                            <td className="px-6 py-4 align-middle text-left">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => onMoveToDaily && onMoveToDaily(task)} 
                                  className="text-blue-400 hover:text-blue-600 p-1" 
                                  title="نقل للمهام اليومية"
                                >
                                  <ListPlus size={16} />
                                </button>
                                <button onClick={() => startEdit(task)} className="text-indigo-400 hover:text-indigo-600 p-1" title="تعديل الاسم/الملاحظات"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(task.id)} className="text-slate-300 hover:text-red-500 p-1" title="حذف المهمة"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                      {/* Expanded Note Row */}
                      {!editingId && task.notes && expandedNotes[task.id] && (
                        <tr className="bg-indigo-50/30 animate-fade-in">
                          <td colSpan={6} className="px-6 py-3 pr-16">
                            <div className="flex items-start gap-2 text-sm text-slate-600">
                              <FileText size={16} className="mt-0.5 text-indigo-400 shrink-0" />
                              <p>{task.notes}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {displayedProjects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search size={32} />
          </div>
          <p className="text-slate-600 font-medium">لم يتم العثور على نتائج.</p>
          <p className="text-slate-400 text-sm mt-1">حاول تغيير خيارات التصفية أو أضف مشروعاً جديداً.</p>
          {(filterProject !== 'ALL' || filterStatus !== 'ALL' || filterPriority !== 'ALL') && (
            <button onClick={resetFilters} className="mt-4 text-indigo-600 hover:underline">إلغاء التصفيات</button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectTable;