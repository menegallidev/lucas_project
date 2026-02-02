-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "personType" "TipoPessoa" NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "stateTaxId" TEXT,
    "birthDate" TIMESTAMP(3),
    "email" TEXT,
    "phone1" TEXT NOT NULL,
    "phone2" TEXT,
    "whatsapp" TEXT,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "referencePoint" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_document_key" ON "clients"("document");
