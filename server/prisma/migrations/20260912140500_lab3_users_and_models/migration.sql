-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_FOR_REQUESTER';
ALTER TYPE "TicketStatus" ADD VALUE 'REOPENED';
ALTER TYPE "TicketStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey from tickets to old requester_users
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_requesterId_fkey";

-- CreateTable users
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Migrate existing records from requester_users into users (Preserving IDs and ticket relations)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'requester_users') THEN
    INSERT INTO "users" ("id", "email", "name", "department", "isActive", "passwordHash", "mustChangePassword", "role", "createdAt", "updatedAt")
    SELECT 
      "id", 
      "email", 
      "name", 
      "department", 
      "isActive", 
      '$2b$10$TYOxRqRTTQWjtHd9/n0SFeW/a0BHPBcXxE6yF35stYJUbsKDBghIK', 
      true, 
      'REQUESTER'::"Role", 
      "createdAt", 
      "updatedAt"
    FROM "requester_users"
    ON CONFLICT ("id") DO NOTHING;

    PERFORM setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
    DROP TABLE "requester_users";
  END IF;
END $$;

-- AlterTable tickets
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "ticketOwner",
ADD COLUMN IF NOT EXISTS "resolvedIndicated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "ticketOwnerId" INTEGER;

-- CreateTable comments
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable internal_notes
CREATE TABLE "internal_notes" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "comments_ticketId_createdAt_idx" ON "comments"("ticketId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "internal_notes_ticketId_createdAt_idx" ON "internal_notes"("ticketId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "tickets_itPriority_idx" ON "tickets"("itPriority");

-- CreateIndex
CREATE INDEX "tickets_ticketOwnerId_idx" ON "tickets"("ticketOwnerId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticketOwnerId_fkey" FOREIGN KEY ("ticketOwnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
