import { db } from '../store/db';
import { GAMIFY_CONSTANTS } from '../config/gamify';

import type { EnergySource, MissionProgressStatus } from '../types.gamify';
import { energyLogsRepo } from '../store/repositories/energyLogsRepo';


function dayKey(date: Date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return normalized.toISOString().slice(0, 10);
}

async function getAttendanceDays(studentId: string) {
  const sessions = await db.sessions.toArray();
  const keys = new Set<string>();
  sessions.forEach((session) => {
    if (!session.attendance?.length) return;
    const present = session.attendance.some((item) => item.studentId === studentId && item.present);
    if (present) {
      keys.add(dayKey(new Date(session.date)));
    }
  });
  return keys;
}

async function getStreakBonus(studentId: string, today: Date) {
  const attendanceDays = await getAttendanceDays(studentId);
  attendanceDays.add(dayKey(today));
  let streak = 0;
  const cursor = new Date(today);
  while (attendanceDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak >= GAMIFY_CONSTANTS.streakBonusThreshold ? GAMIFY_CONSTANTS.streakBonusEnergy : 0;
}

async function addEnergy(studentId: string, delta: number) {
  const student = await db.students.get(studentId);
  const currentEnergy = student?.energy ?? 0;
  await db.students.update(studentId, { energy: currentEnergy + delta });
}



async function applyEnergy(
  studentId: string,
  delta: number,
  source: EnergySource,
  refId?: string,
  metadata?: Record<string, unknown>,
  date: Date = new Date(),
) {
  if (delta === 0) return;
  await addEnergy(studentId, delta);
  await energyLogsRepo.record({
    studentId,
    delta,
    source,
    refId,
    metadata,
    createdAt: date.toISOString(),
  });
}



export const AwardEngine = {
  async awardAttendance(studentId: string, classId: string, date = new Date()) {
    const streakBonus = await getStreakBonus(studentId, date);
    const energy = GAMIFY_CONSTANTS.attendanceEnergy + streakBonus;

    await applyEnergy(studentId, energy, 'attendance', `attendance:${classId}`, { classId }, date);

    await db.missionsProgress.add({
      studentId,
      classId,
      missionId: 'attendance',
      date: date.toISOString(),
      stars: 0,
      energy,
      status: 'completed',
    });
    return { energy, streakBonus };
  },

  async awardMission(
    studentId: string,
    classId: string,
    missionId: string,
    stars: number,
    options: {
      status?: MissionProgressStatus;
      date?: Date;
      progressId?: number;
      honorTitle?: string;
      rewardPoints?: number;
      rewardNote?: string;
    } = {},
  ) {
    const {
      status = 'completed',
      date = new Date(),
      progressId,
      honorTitle,
      rewardPoints,
      rewardNote,
    } = options;
    const safeStars = Math.max(1, Math.min(5, stars));
    const energy = safeStars * GAMIFY_CONSTANTS.missionEnergyPerStar;
    const completedAt = status === 'completed' ? date.toISOString() : undefined;

    const findExisting = async () => {
      if (progressId !== undefined) {
        return db.missionsProgress.get(progressId);
      }
      const existing = await db.missionsProgress
        .where('studentId')
        .equals(studentId)
        .filter(
          (item) =>
            item.missionId === missionId &&
            item.status === 'assigned' &&
            (item.classId === classId || item.classId === 'personal'),
        )
        .first();
      return existing ?? undefined;
    };

    const existing = await findExisting();

    if (existing?.id !== undefined) {
      await db.missionsProgress.update(existing.id, {
        stars: safeStars,
        energy,
        status,
        honorTitle,
        rewardPoints,
        rewardNote,
        completedAt,
      });
    } else {
      await db.missionsProgress.add({
        studentId,
        classId,
        missionId,
        date: date.toISOString(),
        stars: safeStars,
        energy,
        status,
        honorTitle,
        rewardPoints,
        rewardNote,
        completedAt,
      });
    }

    await applyEnergy(studentId, energy, 'mission', missionId, { classId }, date);

    return { stars: safeStars, energy };
  },

  async awardAssessmentRankUp(studentId: string, rankCode: string, badgeName: string) {
    await db.badges.add({
      studentId,
      code: rankCode,
      name: badgeName,
      earnedAt: new Date().toISOString(),
    });


    await applyEnergy(studentId, GAMIFY_CONSTANTS.assessmentRankEnergy, 'assessment', rankCode, {
      badge: badgeName,
    });
    return GAMIFY_CONSTANTS.assessmentRankEnergy;
  },

  async awardKudos({
    fromStudentId,
    toStudentId,
    badge,
    reason,
    classId,
    seasonCode,
  }: {
    fromStudentId: string;
    toStudentId: string;
    badge: string;
    reason?: string;
    classId?: string;
    seasonCode?: string;
  }) {
    const now = new Date();
    const kudosId = await db.kudos.add({
      fromStudentId,
      toStudentId,
      badge,
      reason,
      classId,
      seasonCode,
      createdAt: now.toISOString(),
    });
    await applyEnergy(
      toStudentId,
      GAMIFY_CONSTANTS.kudosEnergy,
      'kudos',
      String(kudosId),
      {
        fromStudentId,
        badge,
        classId,
      },
      now,
    );
    return { id: kudosId, energy: GAMIFY_CONSTANTS.kudosEnergy };
  },

  async grantEnergy(
    studentId: string,
    delta: number,
    source: EnergySource,
    refId?: string,
    metadata?: Record<string, unknown>,
    date?: Date,
  ) {
    await applyEnergy(studentId, delta, source, refId, metadata, date);
  },

};
