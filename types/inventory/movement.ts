import type { InventoryMovementType } from "@prisma/client";

export type InventoryProductOption = {
    id: number;
    label: string;
    stockQuantity: number;
};

export type InventoryMovementRow = {
    id: number;
    movementType: InventoryMovementType;
    productId: number;
    productName: string;
    productModel: string;
    quantity: number;
    performedAt: Date;
    notes: string | null;
};

export type CreateInventoryMovementState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};
