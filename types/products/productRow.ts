import type { ClientStatus } from "@prisma/client";

export type ProductRow = {
    id: number;
    name: string;
    price: number;
    model: string;
    notes: string | null;
    status: ClientStatus;
    stockQuantity: number;
    createdAt: Date;
    updatedAt: Date;
};
