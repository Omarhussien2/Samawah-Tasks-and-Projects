
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ProjectTask, DailyTask, ProjectStatus, DailyStatus } from '../types';
import { Download, Cpu, ChevronLeft } from 'lucide-react';

interface DashboardProps {
  projectTasks: ProjectTask[];
  dailyTasks: DailyTask[];
  onExport: () => void;
  onAIAnalysis: () => void;
  isAnalyzing: boolean;
  // New prop for navigation
  onNavigate: (type: 'PROJECT' | 'DAILY', filterKey?: string, filterValue?: string) => void;
}

const COLORS = {
  [ProjectStatus.COMPLETED]: '#10b981', // Emerald 500
  [ProjectStatus.IN_PROGRESS]: '#f59e0b', // Amber 500
  [ProjectStatus.PENDING]: '#ef4444', // Red 500
};

// Arabic Status Labels
const PROJECT_STATUS_LABELS: Record<string, string> = {
  [ProjectStatus.COMPLETED]: 'مكتمل',
  [ProjectStatus.IN_PROGRESS]: 'جاري العمل',
  [ProjectStatus.PENDING]: 'قيد الانتظار',
};

const Dashboard: React.FC<DashboardProps> = ({ projectTasks, dailyTasks, onExport, onAIAnalysis, isAnalyzing, onNavigate }) => {

  // Metrics Logic
  const stats = useMemo(() => {
    const totalProjects = new Set(projectTasks.map(t => t.projectName)).size;
    const completedTasks = projectTasks.filter(t => t.status === ProjectStatus.COMPLETED).length;
    const pendingTasks = projectTasks.filter(t => t.status === ProjectStatus.PENDING).length;
    const dailyDone = dailyTasks.filter(t => t.status === DailyStatus.DONE).length;
    
    return { totalProjects, completedTasks, pendingTasks, dailyDone };
  }, [projectTasks, dailyTasks]);

  // Pie Chart Data
  const pieData = useMemo(() => {
    const counts = {
      [ProjectStatus.COMPLETED]: 0,
      [ProjectStatus.IN_PROGRESS]: 0,
      [ProjectStatus.PENDING]: 0,
    };
    projectTasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return Object.keys(counts).map(key => ({ 
        name: PROJECT_STATUS_LABELS[key] || key, 
        originalKey: key,
        value: counts[key as ProjectStatus] 
    }));
  }, [projectTasks]);

  // Bar Chart Data (Progress per Project)
  const barData = useMemo(() => {
    const projectMap: Record<string, { name: string, completed: number, total: number }> = {};
    
    projectTasks.forEach(t => {
      if (!projectMap[t.projectName]) {
        projectMap[t.projectName] = { name: t.projectName, completed: 0, total: 0 };
      }
      projectMap[t.projectName].total++;
      if (t.status === ProjectStatus.COMPLETED) {
        projectMap[t.projectName].completed++;
      }
    });

    return Object.values(projectMap).map(p => ({
      name: p.name,
      progress: Math.round((p.completed / p.total) * 100)
    }));
  }, [projectTasks]);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">لوحة التحكم</h2>
          <p className="text-slate-500">نظرة عامة على أدائك عبر {stats.totalProjects} مشاريع.</p>
        </div>
        <div className="flex gap-2">
             <button 
            onClick={onAIAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
          >
            <Cpu size={18} />
            {isAnalyzing ? 'جاري التحليل...' : 'تحليل الذكاء الاصطناعي'}
          </button>
          <button 
            onClick={onExport}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download size={18} />
            تصدير تقرير
          </button>
        </div>
      </header>

      {/* Metrics Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div 
          onClick={() => onNavigate('PROJECT', 'project', 'ALL')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">إجمالي مهام المشاريع</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{projectTasks.length}</p>
            </div>
            <ChevronLeft className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('PROJECT', 'status', ProjectStatus.COMPLETED)}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
        >
           <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">مهام مكتملة (مشاريع)</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.completedTasks}</p>
            </div>
            <ChevronLeft className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('PROJECT', 'status', ProjectStatus.PENDING)}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">إجراءات معلقة</p>
              <p className="text-3xl font-bold text-amber-500 mt-2">{stats.pendingTasks}</p>
            </div>
            <ChevronLeft className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('DAILY', 'view', 'ARCHIVE')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex justify-between items-start">
            <div>
               <p className="text-sm font-medium text-slate-500">أهداف يومية محققة</p>
               <p className="text-3xl font-bold text-blue-600 mt-2">{stats.dailyDone}</p>
            </div>
            <ChevronLeft className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Progress Bar Chart - Clickable */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">نسبة إنجاز المشاريع (%)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={barData} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const projectName = data.activePayload[0].payload.name;
                    onNavigate('PROJECT', 'project', projectName);
                  }
                }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="progress" fill="#6366f1" radius={[4, 0, 0, 4]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart - Clickable */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">حالة المهام العامة</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  className="cursor-pointer outline-none"
                  onClick={(data) => {
                    onNavigate('PROJECT', 'status', data.originalKey);
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.originalKey as ProjectStatus]} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
