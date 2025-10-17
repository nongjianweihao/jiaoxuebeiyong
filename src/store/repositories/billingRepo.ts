import { db } from '../db';
import type { LessonPackage, LessonWallet, PaymentRecord } from '../../types';
import { calculateWallet } from './utils';
import { isSessionClosed } from '../../utils/session';

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
    const [packages, sessions, ledgerEntries] = await Promise.all([
      billingRepo.listPackagesByStudent(studentId),
      db.sessions.filter((session) => isSessionClosed(session)).toArray(),
      db.lessonLedger.where({ studentId }).toArray(),
    ]);
    return calculateWallet(studentId, packages, sessions, ledgerEntries);
  },
  async calcAllWallets(): Promise<LessonWallet[]> {
    const [students, sessions, packages, ledgerEntries] = await Promise.all([
      db.students.toArray(),
      db.sessions.filter((session) => isSessionClosed(session)).toArray(),
      db.lessonPackages.toArray(),
      db.lessonLedger.toArray(),
    ]);
    return students.map((student) =>
      calculateWallet(
        student.id,
        packages.filter((pkg) => pkg.studentId === student.id),
        sessions,
        ledgerEntries.filter((entry) => entry.studentId === student.id),
      ),
    );
  },
};
