import { db } from '../db';
import type { ClassEntity, SessionRecord } from '../../types';

export const classesRepo = {
  async upsert(cls: ClassEntity) {
    await db.classes.put(cls);
  },
  async list() {
    return db.classes.toArray();
  },
  async get(id: string) {
    return db.classes.get(id);
  },
  async sessions(classId: string): Promise<SessionRecord[]> {
    return db.sessions.where({ classId }).sortBy('date');
  },
  async remove(id: string) {
    await db.classes.delete(id);
  },
};
