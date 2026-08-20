/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `soporte_tickets` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "soporte_tickets" DROP CONSTRAINT "soporte_tickets_assignedToId_fkey";

-- DropIndex
DROP INDEX "soporte_tickets_assignedToId_idx";

-- AlterTable
ALTER TABLE "soporte_tickets" DROP COLUMN "assignedToId";
