import { db } from '../db';
import type { SessionReview } from '../../types';

export const retrospectivesRepo = {
  async upsert(review: SessionReview) {
    await db.retrospectives.put(review);
  },
  async list() {
    const records = await db.retrospectives.orderBy('date').reverse().toArray();
    return records;
  },
  async listByClass(classId: string) {
    const records = await db.retrospectives.where('classId').equals(classId).sortBy('date');
    return records.reverse();
  },
  async get(id: string) {
    return db.retrospectives.get(id);
  },
  async remove(id: string) {
    await db.retrospectives.delete(id);
  },
  async listForStudent(studentId: string) {
    const all = await db.retrospectives.toArray();
    return all
      .filter(
        (review) =>
          review.studentHighlights.some((item) => item.studentId === studentId) ||
          review.nextActions.some((item) => item.studentId === studentId),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
};
