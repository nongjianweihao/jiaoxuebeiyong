import { db } from '../db';
import type { LessonPackage, LessonWallet, PaymentRecord, Student } from '../../types';
import { calculateWallet } from './utils';

export const studentsRepo = {
  async upsert(student: Student) {
    await db.students.put(student);
  },
  async list() {
    return db.students.toArray();
  },
  async get(id: string) {
    return db.students.get(id);
  },
  async remove(id: string) {
    await db.students.delete(id);
  },
  async listPackages(studentId: string): Promise<LessonPackage[]> {
    return db.lessonPackages.where({ studentId }).sortBy('purchasedAt');
  },
  async listPayments(studentId: string): Promise<PaymentRecord[]> {
    return db.payments.where({ studentId }).sortBy('paidAt');
  },
  async wallet(studentId: string): Promise<LessonWallet> {
    const packages = await studentsRepo.listPackages(studentId);
    const sessions = await db.sessions.filter((session) => session.closed).toArray();
    return calculateWallet(studentId, packages, sessions);
  },
};
