CREATE TABLE "ClubStory" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" VARCHAR(2000) NOT NULL,
  "imagePath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClubStory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClubStory_createdAt_idx" ON "ClubStory"("createdAt");
CREATE INDEX "ClubStory_authorId_createdAt_idx" ON "ClubStory"("authorId", "createdAt");

ALTER TABLE "ClubStory"
ADD CONSTRAINT "ClubStory_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
