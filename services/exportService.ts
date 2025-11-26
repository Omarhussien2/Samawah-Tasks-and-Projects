import * as XLSX from 'xlsx';
import { ProjectTask, DailyTask } from '../types';

export const exportToExcel = (projectTasks: ProjectTask[], dailyTasks: DailyTask[]) => {
  const wb = XLSX.utils.book_new();

  // Project Sheet
  const projectWs = XLSX.utils.json_to_sheet(projectTasks);
  XLSX.utils.book_append_sheet(wb, projectWs, "Project Tasks");

  // Daily Sheet
  const dailyWs = XLSX.utils.json_to_sheet(dailyTasks);
  XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Tasks");

  // Generate file
  XLSX.writeFile(wb, `TaskFlow_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportDailyHistory = (dailyTasks: DailyTask[]) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dailyTasks);
  XLSX.utils.book_append_sheet(wb, ws, "Daily History");
  XLSX.writeFile(wb, `Daily_History_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  // Add BOM for Excel to recognize UTF-8 (Arabic) properly
  const bom = "\uFEFF"; 
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};