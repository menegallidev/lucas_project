import type { ClientStatus } from "@prisma/client";

export type ProductRow = {
    id: number;
    name: string;
    purchasePrice: number;
    salePrice: number;
    model: string;
    notes: string | null;
    status: ClientStatus;
    stockQuantity: number;
    createdAt: Date;
    updatedAt: Date;
};
