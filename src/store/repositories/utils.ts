import { v4 as uuid } from 'uuid';
import type { LessonPackage, LessonWallet, SessionRecord } from '../../types';

export function generateId() {
  return uuid();
}

export function calculateWallet(
  studentId: string,
  packages: LessonPackage[],
  sessions: SessionRecord[],
): LessonWallet {
  const totalPurchased = packages.reduce((sum, pkg) => sum + pkg.purchasedLessons, 0);
  const totalConsumed = sessions.reduce((sum, session) => {
    if (!session.closed) return sum;
    const base = session.lessonConsume ?? 1;
    const attendance = session.attendance.filter((a) => a.studentId === studentId && a.present);
    if (attendance.length === 0) {
      return sum;
    }
    const override = session.consumeOverrides?.find((item) => item.studentId === studentId);
    return sum + (override ? override.consume : base);
  }, 0);
  return {
    studentId,
    totalPurchased,
    totalConsumed,
    remaining: Number((totalPurchased - totalConsumed).toFixed(2)),
  };
}
