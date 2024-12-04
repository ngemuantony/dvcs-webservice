/*
  Warnings:

  - You are about to drop the `WebhookDeliveryLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `active` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `lastDelivery` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `lastError` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `lastStatus` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `repositoryId` on the `Webhook` table. All the data in the column will be lost.
  - Added the required column `name` to the `Webhook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repoId` to the `Webhook` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "location" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WebhookDeliveryLog";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SSHKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SSHKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'READ',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Collaboration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Collaboration_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Webhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Webhook_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Webhook" ("createdAt", "events", "id", "secret", "updatedAt", "url") SELECT "createdAt", "events", "id", "secret", "updatedAt", "url" FROM "Webhook";
DROP TABLE "Webhook";
ALTER TABLE "new_Webhook" RENAME TO "Webhook";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SSHKey_publicKey_key" ON "SSHKey"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "SSHKey_fingerprint_key" ON "SSHKey"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Collaboration_userId_repositoryId_key" ON "Collaboration"("userId", "repositoryId");
