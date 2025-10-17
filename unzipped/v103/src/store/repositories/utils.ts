import { v4 as uuid } from 'uuid';
import type {
  LessonLedgerEntry,
  LessonPackage,
  LessonWallet,
  SessionRecord,
} from '../../types';

export function generateId() {
  return uuid();
}

export function calculateWallet(
  studentId: string,
  packages: LessonPackage[],
  sessions: SessionRecord[],
  ledgerEntries: LessonLedgerEntry[] = [],
): LessonWallet {
  const totalPurchased = packages.reduce((sum, pkg) => sum + pkg.purchasedLessons, 0);
  const sessionConsumed = sessions.reduce((sum, session) => {
    if (!session.closed) return sum;
    const base = session.lessonConsume ?? 1;
    const attendance = session.attendance.filter((a) => a.studentId === studentId && a.present);
    if (attendance.length === 0) {
      return sum;
    }
    const override = session.consumeOverrides?.find((item) => item.studentId === studentId);
    return sum + (override ? override.consume : base);
  }, 0);
  const manualAdditions = ledgerEntries.reduce(
    (sum, entry) => (entry.lessons > 0 ? sum + entry.lessons : sum),
    0,
  );
  const manualConsumptions = ledgerEntries.reduce(
    (sum, entry) => (entry.lessons < 0 ? sum + Math.abs(entry.lessons) : sum),
    0,
  );
  const totalConsumed = Number((sessionConsumed + manualConsumptions).toFixed(2));
  const manualAdjustments = Number((manualAdditions - manualConsumptions).toFixed(2));
  return {
    studentId,
    totalPurchased,
    totalConsumed,
    remaining: Number((totalPurchased + manualAdditions - totalConsumed).toFixed(2)),
    manualAdjustments,
  };
}
