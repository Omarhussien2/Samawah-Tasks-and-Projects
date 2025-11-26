export enum ProjectStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum ProjectPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum DailyStatus {
  ONGOING = 'Ongoing',
  REMAINING = 'Remaining',
  DONE = 'Done'
}

export interface ProjectTask {
  id: string;
  projectName: string;
  taskName: string;
  deliveryDate: string;
  status: ProjectStatus;
  priority?: ProjectPriority;
  notes?: string;
}

export interface DailyTask {
  id: string;
  taskName: string;
  duration: string;
  linkNotes: string;
  status: DailyStatus;
  completedDate?: string; // ISO Date string YYYY-MM-DD
  originalTaskId?: string; // ID of the ProjectTask this originated from
}

export interface AppData {
  projectTasks: ProjectTask[];
  dailyTasks: DailyTask[];
}

export type ViewState = 'DASHBOARD' | 'PROJECTS' | 'DAILY' | 'SAMAWA_PROJECTS';