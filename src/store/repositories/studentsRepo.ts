import { db } from '../db';
import type { LessonPackage, LessonWallet, PaymentRecord, Student } from '../../types';
import { calculateWallet } from './utils';
import { isSessionClosed } from '../../utils/session';

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
    const [packages, sessions, ledgerEntries] = await Promise.all([
      studentsRepo.listPackages(studentId),
      db.sessions.filter((session) => isSessionClosed(session)).toArray(),
      db.lessonLedger.where({ studentId }).toArray(),
    ]);
    return calculateWallet(studentId, packages, sessions, ledgerEntries);
  },
};
