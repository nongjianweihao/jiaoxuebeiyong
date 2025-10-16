import { db } from '../db';
import type { LessonLedgerEntry } from '../../types';

export interface LessonLedgerQuery {
  studentId?: string;
  from?: string;
  to?: string;
}

export const lessonLedgerRepo = {
  async upsert(entry: LessonLedgerEntry) {
    await db.lessonLedger.put(entry);
  },
  async remove(id: string) {
    await db.lessonLedger.delete(id);
  },
  async get(id: string) {
    return db.lessonLedger.get(id);
  },
  async listByStudent(studentId: string) {
    return db.lessonLedger.where({ studentId }).sortBy('date');
  },
  async list(query?: LessonLedgerQuery) {
    let collection = db.lessonLedger.orderBy('date');
    if (query?.studentId) {
      collection = collection.filter((entry) => entry.studentId === query.studentId);
    }
    if (query?.from) {
      collection = collection.filter((entry) => entry.date >= query.from!);
    }
    if (query?.to) {
      collection = collection.filter((entry) => entry.date <= query.to!);
    }
    return collection.toArray();
  },
};
