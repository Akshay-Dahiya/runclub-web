CREATE TABLE "GarminDailyMetric" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GarminDailyMetric_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GarminDailyMetric_userId_date_key" ON "GarminDailyMetric"("userId", "date");
CREATE INDEX "GarminDailyMetric_userId_date_idx" ON "GarminDailyMetric"("userId", "date");
ALTER TABLE "GarminDailyMetric" ADD CONSTRAINT "GarminDailyMetric_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GarminActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "runId" TEXT,
  "data" JSONB NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GarminActivity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GarminActivity_runId_key" ON "GarminActivity"("runId");
CREATE UNIQUE INDEX "GarminActivity_userId_externalId_key" ON "GarminActivity"("userId", "externalId");
CREATE INDEX "GarminActivity_userId_date_idx" ON "GarminActivity"("userId", "date");
ALTER TABLE "GarminActivity" ADD CONSTRAINT "GarminActivity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GarminActivity" ADD CONSTRAINT "GarminActivity_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "GarminIngestCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GarminIngestCredential_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GarminIngestCredential_userId_key" ON "GarminIngestCredential"("userId");
CREATE UNIQUE INDEX "GarminIngestCredential_tokenHash_key" ON "GarminIngestCredential"("tokenHash");
ALTER TABLE "GarminIngestCredential" ADD CONSTRAINT "GarminIngestCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
