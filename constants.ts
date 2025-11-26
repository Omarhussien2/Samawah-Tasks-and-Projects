import { ProjectTask, ProjectStatus, ProjectPriority, DailyTask, DailyStatus } from './types';

// Simple ID generator if uuid isn't available in the environment
const generateId = () => Math.random().toString(36).substr(2, 9);

export const INITIAL_PROJECT_TASKS: ProjectTask[] = [
  // مشروع هدنة (Hudna)
  { id: generateId(), projectName: 'هدنة', taskName: 'خطة تسويقية', deliveryDate: '2023-12-01', status: ProjectStatus.COMPLETED, priority: ProjectPriority.HIGH },
  { id: generateId(), projectName: 'هدنة', taskName: 'خطة تنفيذية', deliveryDate: '2023-12-05', status: ProjectStatus.COMPLETED, priority: ProjectPriority.HIGH },
  { id: generateId(), projectName: 'هدنة', taskName: 'المحتوى (بايو + ستوري + منصات)', deliveryDate: '2023-12-10', status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.MEDIUM, notes: 'التركيز على انستجرام ولينكد إن.' },
  { id: generateId(), projectName: 'هدنة', taskName: 'المؤثرين', deliveryDate: '2023-12-15', status: ProjectStatus.PENDING, priority: ProjectPriority.MEDIUM },
  { id: generateId(), projectName: 'هدنة', taskName: 'الحملة الإبداعية', deliveryDate: '2023-12-20', status: ProjectStatus.PENDING, priority: ProjectPriority.HIGH },
  { id: generateId(), projectName: 'هدنة', taskName: 'توصيل جمعيات خيرية', deliveryDate: '2023-12-25', status: ProjectStatus.PENDING, priority: ProjectPriority.LOW },
  { id: generateId(), projectName: 'هدنة', taskName: 'قسم الولاء', deliveryDate: '2023-12-30', status: ProjectStatus.PENDING, priority: ProjectPriority.LOW },
  
  // مشروع جلاس (Jalass)
  { id: generateId(), projectName: 'جلاس', taskName: 'ارسال الايميل لجمهور سماوة', deliveryDate: '2023-11-20', status: ProjectStatus.COMPLETED, priority: ProjectPriority.HIGH },
  { id: generateId(), projectName: 'جلاس', taskName: 'قائمة لدعوات جلاس', deliveryDate: '2023-11-22', status: ProjectStatus.COMPLETED, priority: ProjectPriority.MEDIUM },
  { id: generateId(), projectName: 'جلاس', taskName: 'المحتوى العضوي', deliveryDate: '2023-11-25', status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.MEDIUM },
  { id: generateId(), projectName: 'جلاس', taskName: 'إرسال الدعوات المجانية', deliveryDate: '2023-11-28', status: ProjectStatus.PENDING, priority: ProjectPriority.MEDIUM },
  { id: generateId(), projectName: 'جلاس', taskName: 'إنشاء أوتوماتيك', deliveryDate: '2023-12-01', status: ProjectStatus.PENDING, priority: ProjectPriority.LOW },
  { id: generateId(), projectName: 'جلاس', taskName: 'إرسال الدعوات', deliveryDate: '2023-12-05', status: ProjectStatus.PENDING, priority: ProjectPriority.HIGH },

  // مشروع رواسي (Rawsy)
  { id: generateId(), projectName: 'رواسي', taskName: 'متابعة النشر', deliveryDate: '2023-12-01', status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.MEDIUM },
  { id: generateId(), projectName: 'رواسي', taskName: 'مهام المتدربين', deliveryDate: '2023-12-02', status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.LOW },
  { id: generateId(), projectName: 'رواسي', taskName: 'اجتماع مع عبير', deliveryDate: '2023-12-03', status: ProjectStatus.COMPLETED, priority: ProjectPriority.HIGH, notes: 'مناقشة خارطة الطريق للربع الأول' },
  { id: generateId(), projectName: 'رواسي', taskName: 'جدولة النشر (جديد)', deliveryDate: '2023-12-04', status: ProjectStatus.PENDING, priority: ProjectPriority.MEDIUM },

  // مشروع سماوة (Samawa)
  { id: generateId(), projectName: 'سماوة', taskName: 'منتجات B2C (جديد)', deliveryDate: '2023-12-15', status: ProjectStatus.PENDING, priority: ProjectPriority.HIGH },

  // مشروع الذكاء الاصطناعي (AI)
  { id: generateId(), projectName: 'الذكاء الاصطناعي', taskName: 'بوت الأرشفة', deliveryDate: '2023-12-10', status: ProjectStatus.IN_PROGRESS, priority: ProjectPriority.HIGH },
  { id: generateId(), projectName: 'الذكاء الاصطناعي', taskName: 'بوت التعميد/الموافقة', deliveryDate: '2023-12-20', status: ProjectStatus.PENDING, priority: ProjectPriority.MEDIUM },
];

export const INITIAL_DAILY_TASKS: DailyTask[] = [
  { id: generateId(), taskName: 'الاجتماع الصباحي', duration: '30m', linkNotes: 'مناقشة المهام اليومية', status: DailyStatus.DONE, completedDate: new Date().toISOString().split('T')[0] },
  { id: generateId(), taskName: 'مراجعة الأكواد', duration: '1h', linkNotes: 'PR #402', status: DailyStatus.ONGOING },
];