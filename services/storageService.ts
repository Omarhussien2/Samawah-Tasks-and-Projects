import { ProjectTask, DailyTask } from '../types';
import { INITIAL_PROJECT_TASKS, INITIAL_DAILY_TASKS } from '../constants';

const PROJECT_STORAGE_KEY = 'taskflow_projects_v1';
const DAILY_STORAGE_KEY = 'taskflow_daily_v1';

export const loadProjectTasks = (): ProjectTask[] => {
  try {
    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with seed data if empty
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(INITIAL_PROJECT_TASKS));
    return INITIAL_PROJECT_TASKS;
  } catch (e) {
    console.error("Failed to load project tasks", e);
    return INITIAL_PROJECT_TASKS;
  }
};

export const saveProjectTasks = (tasks: ProjectTask[]) => {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(tasks));
};

export const loadDailyTasks = (): DailyTask[] => {
  try {
    const stored = localStorage.getItem(DAILY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(INITIAL_DAILY_TASKS));
    return INITIAL_DAILY_TASKS;
  } catch (e) {
    console.error("Failed to load daily tasks", e);
    return INITIAL_DAILY_TASKS;
  }
};

export const saveDailyTasks = (tasks: DailyTask[]) => {
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(tasks));
};