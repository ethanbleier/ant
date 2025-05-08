/*
  Warnings:

  - A unique constraint covering the columns `[userId,level]` on the table `Save` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `level` to the `Save` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Save" ADD COLUMN     "level" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Save_userId_level_key" ON "Save"("userId", "level");
