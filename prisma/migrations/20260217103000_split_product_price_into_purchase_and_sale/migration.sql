-- AlterTable
ALTER TABLE "products"
ADD COLUMN "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "salePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Migrate current price values to the new fields
UPDATE "products"
SET
    "purchasePrice" = "price",
    "salePrice" = "price";

-- Drop old column
ALTER TABLE "products"
DROP COLUMN "price";

-- Remove temporary defaults
ALTER TABLE "products"
ALTER COLUMN "purchasePrice" DROP DEFAULT,
ALTER COLUMN "salePrice" DROP DEFAULT;
