CREATE TABLE IF NOT EXISTS "CoachProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "pb5kSec" INTEGER,
  "pb10kSec" INTEGER,
  "pbHMSec" INTEGER,
  "pbMarathonSec" INTEGER,
  "hasRacedBefore" BOOLEAN NOT NULL DEFAULT false,
  "lastRaceDate" TIMESTAMP(3),
  "weeklyKmCurrent" DOUBLE PRECISION,
  "yearsRunning" DOUBLE PRECISION,
  "daysPerWeek" INTEGER,
  "strengthDays" INTEGER DEFAULT 0,
  "hasGym" BOOLEAN NOT NULL DEFAULT false,
  "treadmillAccess" BOOLEAN NOT NULL DEFAULT false,
  "outdoorAccess" BOOLEAN NOT NULL DEFAULT true,
  "sessionMinutes" INTEGER,
  "easyPaceSec" INTEGER,
  "avgEasyKm" DOUBLE PRECISION,
  "longestLast30" DOUBLE PRECISION,
  "hasHRMonitor" BOOLEAN NOT NULL DEFAULT false,
  "restingHR" INTEGER,
  "currentInjury" TEXT,
  "recurringInjury" TEXT,
  "prefersWalkRun" BOOLEAN NOT NULL DEFAULT false,
  "sleepHours" DOUBLE PRECISION,
  "goalRace" TEXT,
  "goalRaceDate" TIMESTAMP(3),
  "goalTimeSec" INTEGER,
  "isFirstRace" BOOLEAN NOT NULL DEFAULT false,
  "activePlanId" TEXT,
  "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CoachProfile_userId_key" ON "CoachProfile"("userId");

CREATE TABLE IF NOT EXISTS "TrainingPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "goalRace" TEXT NOT NULL,
  "goalTimeSec" INTEGER NOT NULL,
  "goalRaceDate" TIMESTAMP(3),
  "weeksTotal" INTEGER NOT NULL,
  "currentWeek" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'active',
  "planData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WeeklyReview" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "kmPlanned" DOUBLE PRECISION NOT NULL,
  "kmCompleted" DOUBLE PRECISION NOT NULL,
  "workoutsPlanned" INTEGER NOT NULL,
  "workoutsDone" INTEGER NOT NULL,
  "avgPaceSec" INTEGER,
  "avgHR" INTEGER,
  "aiSummary" TEXT NOT NULL,
  "nextWeekFocus" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyReview_planId_weekNumber_key" ON "WeeklyReview"("planId", "weekNumber");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CoachProfile_userId_fkey') THEN
    ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrainingPlan_userId_fkey') THEN
    ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WeeklyReview_planId_fkey') THEN
    ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
