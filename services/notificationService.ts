import { ProjectTask } from '../types';

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png', // Generic task icon
      dir: 'rtl',
      lang: 'ar'
    });
  }
};

export const checkUpcomingTasks = (tasks: ProjectTask[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  tasks.forEach(task => {
    if (!task.deliveryDate) return;
    
    const dueDate = new Date(task.deliveryDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Check if due today
    if (dueDate.getTime() === today.getTime()) {
      sendNotification(
        "تذكير بموعد التسليم",
        `المهمة "${task.taskName}" في مشروع "${task.projectName}" موعد تسليمها اليوم!`
      );
    }
  });
};