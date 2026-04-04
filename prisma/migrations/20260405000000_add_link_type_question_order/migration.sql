-- AlterTable: add questionOrder to QuizAttempt
ALTER TABLE "QuizAttempt" ADD COLUMN "questionOrder" TEXT NOT NULL DEFAULT '';

-- AlterTable: add linkType to QuizLink
ALTER TABLE "QuizLink" ADD COLUMN "linkType" TEXT NOT NULL DEFAULT 'PUBLIC';

-- Set existing private links (those with a userId) to PRIVATE
UPDATE "QuizLink" SET "linkType" = 'PRIVATE' WHERE "userId" IS NOT NULL;
