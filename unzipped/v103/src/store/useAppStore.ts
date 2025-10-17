import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ClassEntity,
  FitnessTestItem,
  FitnessTestResult,
  LessonPackage,
  PaymentRecord,
  SessionRecord,
  Student,
  TrainingTemplate,
} from '../types';

interface AppState {
  students: Student[];
  classes: ClassEntity[];
  templates: TrainingTemplate[];
  sessions: SessionRecord[];
  testItems: FitnessTestItem[];
  testResults: FitnessTestResult[];
  packages: LessonPackage[];
  payments: PaymentRecord[];
  setStudents(students: Student[]): void;
  setClasses(classes: ClassEntity[]): void;
  setTemplates(templates: TrainingTemplate[]): void;
  setSessions(sessions: SessionRecord[]): void;
  setTestItems(items: FitnessTestItem[]): void;
  setTestResults(results: FitnessTestResult[]): void;
  setPackages(packages: LessonPackage[]): void;
  setPayments(payments: PaymentRecord[]): void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      students: [],
      classes: [],
      templates: [],
      sessions: [],
      testItems: [],
      testResults: [],
      packages: [],
      payments: [],
      setStudents: (students) => set({ students }),
      setClasses: (classes) => set({ classes }),
      setTemplates: (templates) => set({ templates }),
      setSessions: (sessions) => set({ sessions }),
      setTestItems: (testItems) => set({ testItems }),
      setTestResults: (testResults) => set({ testResults }),
      setPackages: (packages) => set({ packages }),
      setPayments: (payments) => set({ payments }),
    }),
    {
      name: 'coach-cache',
      partialize: ({ students, classes, templates }) => ({ students, classes, templates }),
    },
  ),
);
