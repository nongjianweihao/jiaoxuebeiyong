import { db } from '../db';
import type { EnergyLog, EnergySource } from '../../types.gamify';

export const energyLogsRepo = {
  async record(entry: Omit<EnergyLog, 'id'>) {
    await db.energyLogs.add(entry);
  },

  async listAll() {
    return db.energyLogs.toArray();
  },

  async listBetween(startIso: string, endIso: string) {
    return db.energyLogs
      .where('createdAt')
      .between(startIso, endIso, true, true)
      .toArray();
  },

  async listBySources(sources: EnergySource[], startIso?: string) {
    const all = await db.energyLogs.toArray();
    return all.filter((log) => {
      if (!sources.includes(log.source)) return false;
      if (!startIso) return true;
      return log.createdAt >= startIso;
    });
  },
};
