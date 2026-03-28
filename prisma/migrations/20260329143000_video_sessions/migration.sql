ALTER TABLE "RitualSession" ALTER COLUMN "ritualId" DROP NOT NULL;

ALTER TABLE "RitualSession" ADD COLUMN "videoId" TEXT;

CREATE INDEX "RitualSession_videoId_status_idx" ON "RitualSession"("videoId", "status");

ALTER TABLE "RitualSession"
ADD CONSTRAINT "RitualSession_videoId_fkey"
FOREIGN KEY ("videoId") REFERENCES "Video"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
