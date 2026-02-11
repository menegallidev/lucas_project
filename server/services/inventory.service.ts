import { prisma } from "@/lib/prisma";
import type { InventoryProductOption, InventoryMovementRow } from "@/types/inventory/movement";
import { ClientStatus, InventoryMovementType } from "@prisma/client";

export async function listInventoryProductsForSelect(): Promise<InventoryProductOption[]> {
    const products = await prisma.product.findMany({
        where: { status: ClientStatus.ATIVO },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            model: true,
            stockQuantity: true,
        },
    });

    return products.map((product) => ({
        id: product.id,
        label: `${product.name} (${product.model})`,
        stockQuantity: product.stockQuantity,
    }));
}

export async function listInventoryMovements(limit = 100): Promise<InventoryMovementRow[]> {
    const movements = await prisma.inventoryMovement.findMany({
        orderBy: [{ performedAt: "desc" }, { id: "desc" }],
        take: limit,
        select: {
            id: true,
            movementType: true,
            quantity: true,
            performedAt: true,
            notes: true,
            productId: true,
            product: {
                select: {
                    name: true,
                    model: true,
                },
            },
        },
    });

    return movements.map((movement) => ({
        id: movement.id,
        movementType: movement.movementType,
        productId: movement.productId,
        productName: movement.product.name,
        productModel: movement.product.model,
        quantity: movement.quantity,
        performedAt: movement.performedAt,
        notes: movement.notes,
    }));
}

export async function createInventoryMovement(input: {
    movementType: InventoryMovementType;
    productId: number;
    quantity: number;
    performedAt: Date;
    notes?: string | null;
}) {
    if (!Number.isInteger(input.productId) || input.productId <= 0) {
        throw new Error("Produto invalido.");
    }

    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
        throw new Error("Quantidade invalida.");
    }

    return prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: { id: input.productId },
            select: {
                id: true,
                status: true,
                stockQuantity: true,
            },
        });

        if (!product) {
            throw new Error("Produto nao encontrado.");
        }

        if (product.status !== ClientStatus.ATIVO) {
            throw new Error("Somente produtos ativos podem ser movimentados.");
        }

        const isEntrada = input.movementType === InventoryMovementType.ENTRADA;
        const nextStock = isEntrada
            ? product.stockQuantity + input.quantity
            : product.stockQuantity - input.quantity;

        if (!isEntrada && nextStock < 0) {
            throw new Error("Estoque insuficiente para esta saida.");
        }

        await tx.inventoryMovement.create({
            data: {
                movementType: input.movementType,
                productId: input.productId,
                quantity: input.quantity,
                performedAt: input.performedAt,
                notes: input.notes ?? null,
            },
        });

        await tx.product.update({
            where: { id: input.productId },
            data: {
                stockQuantity: nextStock,
            },
        });

        return { ok: true, nextStock };
    });
}
