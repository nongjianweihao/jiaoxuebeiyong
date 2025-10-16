import { db } from '../db';
import type { Kudos } from '../../types.gamify';

export const kudosRepo = {
  async listByClass(classId: string) {
    const list = await db.kudos.where('classId').equals(classId).toArray();
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listAll() {
    return db.kudos.toArray();
  },

  async listByStudent(studentId: string) {
    const list = await db.kudos.where('toStudentId').equals(studentId).toArray();
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listRecent(limit = 20) {
    const all = await db.kudos.orderBy('createdAt').reverse().toArray();
    return all.slice(0, limit);
  },
};
