import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckSquare, CalendarClock, Menu, X, Rocket, Bell, FileSpreadsheet, FileText as FileIcon, LayoutGrid } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProjectTable from './components/ProjectTable';
import DailyTable from './components/DailyTable';
import SamawaProjects from './components/SamawaProjects';
import { ProjectTask, DailyTask, ViewState, DailyStatus } from './types';
import * as Storage from './services/storageService';
import * as Exporter from './services/exportService';
import { analyzeProductivity } from './services/geminiService';
import { requestNotificationPermission, checkUpcomingTasks } from './services/notificationService';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  // State - Initialize directly from storage to avoid overwrite issues
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>(() => Storage.loadProjectTasks());
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => Storage.loadDailyTasks());
  
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Navigation Filters State
  const [externalProjectFilters, setExternalProjectFilters] = useState<{status?: string, project?: string} | null>(null);
  const [externalDailyView, setExternalDailyView] = useState<'PLANNER' | 'ARCHIVE' | null>(null);

  // Modals & Popups
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // Initialize Notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationEnabled(true);
      checkUpcomingTasks(projectTasks);
    }
  }, []); // Run once on mount

  // Persistence Effects - Run on EVERY change, even if empty
  useEffect(() => {
    Storage.saveProjectTasks(projectTasks);
  }, [projectTasks]);

  useEffect(() => {
    Storage.saveDailyTasks(dailyTasks);
  }, [dailyTasks]);

  // Handlers
  const handleExportOpen = () => {
    setExportModalOpen(true);
  };

  const executeExport = (type: 'EXCEL' | 'CSV_PROJECTS' | 'CSV_DAILY') => {
    if (type === 'EXCEL') {
      Exporter.exportToExcel(projectTasks, dailyTasks);
    } else if (type === 'CSV_PROJECTS') {
      Exporter.exportToCSV(projectTasks, 'Project_Tasks');
    } else if (type === 'CSV_DAILY') {
      Exporter.exportToCSV(dailyTasks, 'Daily_Tasks');
    }
    setExportModalOpen(false);
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted) {
      checkUpcomingTasks(projectTasks);
    }
  };

  const handleAI = async () => {
    setAiModalOpen(true);
    if (!aiAnalysis) {
      setIsAnalyzing(true);
      const result = await analyzeProductivity(projectTasks, dailyTasks);
      setAiAnalysis(result);
      setIsAnalyzing(false);
    }
  };

  // --- Logic: Move to Daily & Cross-Completion ---
  
  const handleMoveToDaily = (projectTask: ProjectTask) => {
    const newDaily: DailyTask = {
      id: Math.random().toString(36).substr(2, 9),
      taskName: projectTask.taskName,
      duration: '0m',
      linkNotes: projectTask.notes ? `[${projectTask.projectName}] ${projectTask.notes}` : `[${projectTask.projectName}]`,
      status: DailyStatus.ONGOING,
      originalTaskId: projectTask.id
    };
    
    setDailyTasks(prev => [newDaily, ...prev]);
    // Optional: Notify user
    alert(`تم نسخ المهمة "${projectTask.taskName}" إلى المخطط اليومي.`);
  };

  const handleDailyTaskCompletion = (dailyTask: DailyTask) => {
    // 1. Mark in Daily as Done
    const updatedDaily = dailyTasks.map(t => 
      t.id === dailyTask.id 
        ? { ...t, status: DailyStatus.DONE, completedDate: new Date().toISOString().split('T')[0] }
        : t
    );
    setDailyTasks(updatedDaily);

    // 2. Check if linked to Project and Prompt User
    if (dailyTask.originalTaskId) {
       // Check if the original task still exists
       const existsInProject = projectTasks.some(p => p.id === dailyTask.originalTaskId);
       if (existsInProject) {
         // Small delay to allow UI to update first
         setTimeout(() => {
            const shouldDelete = window.confirm(
              "هذه المهمة مرتبطة بمشروع في مساحة العمل.\n\nهل تريد حذفها من قائمة مهام المشروع (باعتبارها انتهت)؟\n\n- موافق: حذف من المشروع\n- إلغاء: إبقائها في المشروع"
            );
            
            if (shouldDelete) {
              setProjectTasks(prev => prev.filter(p => p.id !== dailyTask.originalTaskId));
            }
         }, 100);
       }
    }
  };

  // Dashboard Navigation Logic
  const handleDashboardNavigate = (type: 'PROJECT' | 'DAILY', filterKey?: string, filterValue?: string) => {
    if (type === 'PROJECT') {
      // Set filters
      if (filterKey === 'status') {
        setExternalProjectFilters({ status: filterValue, project: 'ALL' });
      } else if (filterKey === 'project') {
        setExternalProjectFilters({ status: 'ALL', project: filterValue });
      } else {
        setExternalProjectFilters({ status: 'ALL', project: 'ALL' });
      }
      setCurrentView('PROJECTS');
    } else if (type === 'DAILY') {
      if (filterKey === 'view' && filterValue === 'ARCHIVE') {
        setExternalDailyView('ARCHIVE');
      } else {
        setExternalDailyView('PLANNER');
      }
      setCurrentView('DAILY');
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        // Reset filters when manually navigating via sidebar
        setExternalProjectFilters(null);
        setExternalDailyView(null);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        currentView === view 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-[Cairo]" dir="rtl">
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xl">
            <Rocket /> تاسك فلو
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="لوحة التحكم" />
          <NavItem view="SAMAWA_PROJECTS" icon={LayoutGrid} label="مشاريع سماوة" />
          <NavItem view="PROJECTS" icon={CheckSquare} label="جدول المشاريع" />
          <NavItem view="DAILY" icon={CalendarClock} label="المخطط اليومي" />
        </nav>

        <div className="absolute bottom-0 w-full p-6 bg-slate-50 border-t border-slate-200 space-y-4">
           {!notificationEnabled && (
             <button onClick={enableNotifications} className="w-full flex items-center justify-center gap-2 text-xs text-indigo-600 bg-indigo-50 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
               <Bell size={14} /> تفعيل التنبيهات
             </button>
           )}
          <div className="text-xs text-slate-400 text-center">
            &copy; 2024 TaskFlow Pro<br/>
            التخزين المحلي مفعل
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b border-slate-200 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-700">تاسك فلو</span>
          <div className="w-6"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === 'DASHBOARD' && (
              <Dashboard 
                projectTasks={projectTasks} 
                dailyTasks={dailyTasks} 
                onExport={handleExportOpen}
                onAIAnalysis={handleAI}
                isAnalyzing={isAnalyzing}
                onNavigate={handleDashboardNavigate}
              />
            )}
            {currentView === 'SAMAWA_PROJECTS' && (
              <SamawaProjects 
                tasks={projectTasks} 
                onUpdate={setProjectTasks} 
                onMoveToDaily={handleMoveToDaily}
              />
            )}
            {currentView === 'PROJECTS' && (
              <ProjectTable 
                tasks={projectTasks} 
                onUpdate={setProjectTasks} 
                externalFilterStatus={externalProjectFilters?.status}
                externalFilterProject={externalProjectFilters?.project}
                onMoveToDaily={handleMoveToDaily}
              />
            )}
            {currentView === 'DAILY' && (
              <DailyTable 
                tasks={dailyTasks} 
                onUpdate={setDailyTasks} 
                externalView={externalDailyView}
                onCompleteTask={handleDailyTaskCompletion}
              />
            )}
          </div>
        </div>
      </main>

      {/* Export Options Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in text-right">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">خيارات التصدير</h3>
              <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button onClick={() => executeExport('EXCEL')} className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors text-right">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                   <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-700">تقرير شامل (Excel)</div>
                  <div className="text-xs text-slate-500">يتضمن كافة المهام اليومية والمشاريع</div>
                </div>
              </button>
              <div className="h-px bg-slate-100 mx-3 my-1"></div>
              <button onClick={() => executeExport('CSV_PROJECTS')} className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors text-right">
                 <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                   <FileIcon size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-700">مهام المشاريع (CSV)</div>
                  <div className="text-xs text-slate-500">قائمة مهام المشاريع فقط</div>
                </div>
              </button>
               <button onClick={() => executeExport('CSV_DAILY')} className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors text-right">
                 <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                   <FileIcon size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-700">المخطط اليومي (CSV)</div>
                  <div className="text-xs text-slate-500">سجل المهام اليومية والأرشيف</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-fade-in text-right">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
              <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Rocket size={18} />
                </div>
                تحليل الذكاء الاصطناعي
              </h3>
              <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 animate-pulse">جاري تحليل البيانات...</p>
                </div>
              ) : (
                <div className="prose prose-slate prose-sm max-w-none text-right" dir="rtl">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setAiModalOpen(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;