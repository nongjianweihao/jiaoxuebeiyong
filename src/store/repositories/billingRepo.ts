import { db } from '../db';
import type { LessonPackage, LessonWallet, PaymentRecord } from '../../types';
import { calculateWallet } from './utils';

export const billingRepo = {
  async addPackage(pkg: LessonPackage) {
    await db.lessonPackages.put(pkg);
  },
  async listPackagesByStudent(studentId: string) {
    return db.lessonPackages.where({ studentId }).sortBy('purchasedAt');
  },
  async addPayment(record: PaymentRecord) {
    await db.payments.put(record);
  },
  async listPayments(range?: { from?: string; to?: string }) {
    let collection = db.payments.orderBy('paidAt');
    if (range?.from) {
      collection = collection.filter((item) => item.paidAt >= range.from!);
    }
    if (range?.to) {
      collection = collection.filter((item) => item.paidAt <= range.to!);
    }
    return collection.toArray();
  },
  async calcWallet(studentId: string): Promise<LessonWallet> {
    const packages = await billingRepo.listPackagesByStudent(studentId);
    const sessions = await db.sessions.filter((session) => session.closed).toArray();
    return calculateWallet(studentId, packages, sessions);
  },
  async calcAllWallets(): Promise<LessonWallet[]> {
    const [students, sessions, packages] = await Promise.all([
      db.students.toArray(),
      db.sessions.filter((session) => session.closed).toArray(),
      db.lessonPackages.toArray(),
    ]);
    return students.map((student) =>
      calculateWallet(
        student.id,
        packages.filter((pkg) => pkg.studentId === student.id),
        sessions,
      ),
    );
  },
};
