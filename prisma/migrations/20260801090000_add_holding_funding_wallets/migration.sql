-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('HOLDING', 'FUNDING', 'LEGACY');

-- CreateEnum
CREATE TYPE "WalletTransferType" AS ENUM ('HOLDING_TO_FUNDING');

-- CreateEnum
CREATE TYPE "WalletTransferStatus" AS ENUM ('COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "holdingBalanceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "fundingBalanceCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN "account" "LedgerAccount" NOT NULL DEFAULT 'FUNDING';
ALTER TABLE "LedgerEntry" ADD COLUMN "transferId" TEXT;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN "payoutMethod" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN "destinationDetails" JSONB;

-- CreateTable
CREATE TABLE "FreelanceIdentityReference" (
    "id" TEXT NOT NULL,
    "freelanceIdCode" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreelanceIdentityReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFreelanceVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "freelanceIdCode" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFreelanceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "type" "WalletTransferType" NOT NULL DEFAULT 'HOLDING_TO_FUNDING',
    "status" "WalletTransferStatus" NOT NULL DEFAULT 'COMPLETED',
    "verificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FreelanceIdentityReference_freelanceIdCode_key" ON "FreelanceIdentityReference"("freelanceIdCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserFreelanceVerification_userId_key" ON "UserFreelanceVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFreelanceVerification_freelanceIdCode_key" ON "UserFreelanceVerification"("freelanceIdCode");

-- CreateIndex
CREATE INDEX "WalletTransfer_userId_idx" ON "WalletTransfer"("userId");

-- CreateIndex
CREATE INDEX "WalletTransfer_verificationId_idx" ON "WalletTransfer"("verificationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_transferId_idx" ON "LedgerEntry"("transferId");

-- CreateIndex
CREATE INDEX "LedgerEntry_account_idx" ON "LedgerEntry"("account");

-- AddForeignKey
ALTER TABLE "UserFreelanceVerification" ADD CONSTRAINT "UserFreelanceVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFreelanceVerification" ADD CONSTRAINT "UserFreelanceVerification_freelanceIdCode_fkey" FOREIGN KEY ("freelanceIdCode") REFERENCES "FreelanceIdentityReference"("freelanceIdCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "UserFreelanceVerification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "WalletTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
