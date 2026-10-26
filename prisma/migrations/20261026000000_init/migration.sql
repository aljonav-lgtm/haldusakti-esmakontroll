-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('TEXT', 'TXT', 'PDF', 'DOCX');

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputType" "InputType" NOT NULL,
    "foundCount" INTEGER NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "missingCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

