export const dexieSchema = {
  trainingQualities: '&id',
  trainingDrills: '&id',
  trainingGames: '&id',
  missionCardsV2: '&id',
  cycleTemplates: '&id',
  classCyclePlans: '&id, classId, cycleId',
  cycleReports: '&id, studentId, cycleId, planId',
  rewardItems: '&id, type, visible, seasonTag',
  studentExchanges: '&id, studentId, rewardId, status, redeemedAt',
  lessonLedger: '&id, studentId, date',
};

export const prismaSchema = `
model TrainingQuality {
  id          String @id
  name        String
  description String
  color       String
  icon        String
  drills      TrainingDrill[]
}

model TrainingDrill {
  id                String @id
  name              String
  primaryAbilities  String
  secondaryAbilities String?
  stimulusType      String
  intensity         String
  durationMin       Int
  videoUrl          String?
  equipment         String?
  coachTips         String?
  missionBlocks     MissionBlock[]
}

model TrainingGame {
  id             String @id
  name           String
  goal           String
  focusAbilities String
  stimulusType   String
  intensity      String
  groupSize      String
  durationMin    Int
  equipment      String?
  rules          String
  coachTips      String?
  variations     String?
  missionBlocks  MissionBlock[]
}

model MissionCard {
  id             String @id
  name           String
  phase          String
  durationMin    Int
  focusAbilities String
  blocks         MissionBlock[]
  cycleWeeks     CycleWeekPlan[]
}

model MissionBlock {
  id            String @id @default(cuid())
  title         String
  stimulus      String
  intensity     String
  drillIds      String?
  gameIds       String?
  missionCard   MissionCard @relation(fields: [missionCardId], references: [id])
  missionCardId String
}

model CycleTemplate {
  id             String @id
  name           String
  goal           String
  durationWeeks  Int
  focusAbilities String
  trackingMetrics String
  weeks          CycleWeekPlan[]
  classPlans     ClassCyclePlan[]
}

model CycleWeekPlan {
  id            String @id @default(cuid())
  week          Int
  focus         String
  missionCards  String
  template      CycleTemplate @relation(fields: [templateId], references: [id])
  templateId    String
}

model ClassCyclePlan {
  id              String @id
  classId         String
  cycleId         String
  cycleName       String
  goal            String
  durationWeeks   Int
  startDate       DateTime
  currentWeek     Int
  progress        Float
  focusAbilities  String
  trackingMetrics String
  completedAt     DateTime?
  cycleReports    CycleReport[]
  sessions        ClassCycleSession[]
}

model ClassCycleSession {
  id         String @id
  week       Int
  missionCardId String
  plannedDate DateTime
  actualDate  DateTime?
  status      String
  plan        ClassCyclePlan @relation(fields: [planId], references: [id])
  planId      String
}

model CycleReport {
  id          String @id
  planId      String
  cycleId     String
  studentId   String
  classId     String
  cycleName   String
  generatedAt DateTime
  startDate   DateTime
  endDate     DateTime
  abilityBefore Json
  abilityAfter  Json
  sriBefore     Float?
  sriAfter      Float?
  highlights    Json
  suggestions   Json
  plan          ClassCyclePlan @relation(fields: [planId], references: [id])
}

model RewardItem {
  id          String @id
  name        String
  type        String
  costScore   Int
  costEnergy  Int?
  stock       Int?
  description String
  imageUrl    String?
  visible     Boolean @default(true)
  levelLimit  Int?
  seasonTag   String?
  featured    Boolean?
  exchanges   StudentExchange[]
}

model StudentExchange {
  id         String @id
  studentId  String
  rewardId   String
  costScore  Int
  costEnergy Int?
  redeemedAt DateTime
  status     String
  note       String?
  reward     RewardItem @relation(fields: [rewardId], references: [id])
}
`;
