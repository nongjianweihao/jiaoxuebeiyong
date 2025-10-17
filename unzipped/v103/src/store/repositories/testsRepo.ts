import { db } from '../db';
import type {
  FitnessTestItem,
  FitnessTestResult,
  RankExamRecord,
  Recommendation,
  MetricsSnapshot,
} from '../../types';

export const testsRepo = {
  async upsertItem(item: FitnessTestItem) {
    await db.fitnessTestItems.put(item);
  },
  async listItems() {
    return db.fitnessTestItems.toArray();
  },
  async upsertResult(result: FitnessTestResult) {
    await db.fitnessTests.put(result);
  },
  async listResultsByStudent(studentId: string) {
    return db.fitnessTests.where({ studentId }).sortBy('date');
  },
  async removeResult(id: string) {
    await db.fitnessTests.delete(id);
  },
  async upsertRankExam(record: RankExamRecord) {
    await db.rankExams.put(record);
  },
  async listRankExams(studentId: string) {
    return db.rankExams.where({ studentId }).sortBy('date');
  },
  async removeRankExam(id: string) {
    await db.rankExams.delete(id);
  },
  async upsertRecommendation(rec: Recommendation) {
    await db.recommendations.put(rec);
  },
  async listRecommendations(studentId: string) {
    return db.recommendations.where({ studentId }).sortBy('createdAt');
  },
  async upsertMetrics(snapshot: MetricsSnapshot) {
    await db.metrics.put(snapshot);
  },
  async listMetrics(studentId: string) {
    return db.metrics.where({ studentId }).sortBy('weekOf');
  },
};
