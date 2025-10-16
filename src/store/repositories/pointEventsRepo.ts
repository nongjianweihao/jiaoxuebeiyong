import { db } from '../db';
import type { PointEvent, PointEventType, PointsRule } from '../../types';

export const pointEventsRepo = {
  async add(event: PointEvent) {
    await db.pointEvents.put(event);
  },
  async bulkAdd(events: PointEvent[]) {
    if (!events.length) return;
    await db.pointEvents.bulkPut(events);
  },
  async listByStudent(studentId: string) {
    return db.pointEvents.where({ studentId }).sortBy('date');
  },
  async listRecentByStudent(studentId: string, limit = 100) {
    const list = await db.pointEvents.where({ studentId }).sortBy('date');
    if (list.length <= limit) return list;
    return list.slice(list.length - limit);
  },
  async listBySession(sessionId: string) {
    return db.pointEvents.where({ sessionId }).toArray();
  },
  async remove(id: string) {
    await db.pointEvents.delete(id);
  },
  async removeBySession(sessionId: string) {
    const events = await db.pointEvents.where({ sessionId }).primaryKeys();
    if (events.length) {
      await db.pointEvents.bulkDelete(events as string[]);
    }
  },
  async rules() {
    return db.pointsRules.toArray();
  },
  async saveRules(rules: PointsRule[]) {
    await db.pointsRules.clear();
    if (rules.length) {
      await db.pointsRules.bulkPut(rules);
    }
  },
};
