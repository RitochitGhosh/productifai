/*
  Warnings:

  - The `difficulty` column on the `cards` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."cards" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'Medium';
