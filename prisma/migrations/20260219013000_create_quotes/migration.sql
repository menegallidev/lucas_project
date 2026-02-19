-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDENTE', 'VENDIDO');

-- CreateEnum
CREATE TYPE "QuoteDiscountType" AS ENUM ('AMOUNT', 'PERCENT');

-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDENTE',
    "generalDiscountType" "QuoteDiscountType" NOT NULL DEFAULT 'AMOUNT',
    "generalDiscountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseTotal" DOUBLE PRECISION NOT NULL,
    "saleGrossTotal" DOUBLE PRECISION NOT NULL,
    "itemDiscountTotal" DOUBLE PRECISION NOT NULL,
    "generalDiscountAmount" DOUBLE PRECISION NOT NULL,
    "saleNetTotal" DOUBLE PRECISION NOT NULL,
    "soldAt" TIMESTAMP(3),
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" SERIAL NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "purchaseUnitPrice" DOUBLE PRECISION NOT NULL,
    "saleUnitPrice" DOUBLE PRECISION NOT NULL,
    "discountType" "QuoteDiscountType" NOT NULL DEFAULT 'AMOUNT',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPurchase" DOUBLE PRECISION NOT NULL,
    "totalSaleGross" DOUBLE PRECISION NOT NULL,
    "totalSaleNet" DOUBLE PRECISION NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotes_status_createdAt_idx" ON "quotes"("status", "createdAt");

-- CreateIndex
CREATE INDEX "quotes_clientId_idx" ON "quotes"("clientId");

-- CreateIndex
CREATE INDEX "quote_items_quoteId_idx" ON "quote_items"("quoteId");

-- CreateIndex
CREATE INDEX "quote_items_productId_idx" ON "quote_items"("productId");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
