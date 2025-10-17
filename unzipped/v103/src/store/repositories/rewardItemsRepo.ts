import { db } from '../db';
import type { RewardItem, RewardItemType } from '../../types.gamify';

export interface RewardListOptions {
  includeHidden?: boolean;
  type?: RewardItemType | 'all';
  seasonTag?: string;
}

export const rewardItemsRepo = {
  async list(options: RewardListOptions = {}) {
    const { includeHidden = false, type = 'all', seasonTag } = options;
    const items = await db.rewardItems.toArray();
    return items.filter((item) => {
      if (!includeHidden && item.visible === false) return false;
      if (type !== 'all' && item.type !== type) return false;
      if (seasonTag && item.seasonTag !== seasonTag) return false;
      return true;
    });
  },

  async listVisibleByType(type: RewardItemType | 'all' = 'all') {
    return this.list({ includeHidden: false, type });
  },

  async get(id: string) {
    return db.rewardItems.get(id);
  },

  async upsert(item: RewardItem) {
    await db.rewardItems.put(item);
  },

  async bulkUpsert(items: RewardItem[]) {
    if (!items.length) return;
    await db.rewardItems.bulkPut(items);
  },

  async updateStock(id: string, stock: number | undefined) {
    await db.rewardItems.update(id, { stock });
  },

  async toggleVisibility(id: string, visible: boolean) {
    await db.rewardItems.update(id, { visible });
  },

  async remove(id: string) {
    await db.rewardItems.delete(id);
  },
};
