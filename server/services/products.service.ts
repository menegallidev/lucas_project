import { prisma } from "@/lib/prisma";
import { ProductRow } from "@/types/products/productRow";
import type { QuoteProductOption } from "@/types/quotes/quote";
import { ClientStatus } from "@prisma/client";

export async function listProductsBySearch(search?: string): Promise<ProductRow[]> {
    const formattedSearch: string = (search ?? "").trim();

    const items = prisma.product.findMany({
        where: formattedSearch
            ? {
                OR: [
                    { name: { contains: formattedSearch, mode: "insensitive" } },
                    { model: { contains: formattedSearch, mode: "insensitive" } },
                    { notes: { contains: formattedSearch, mode: "insensitive" } },
                ],
            }
            : undefined,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            purchasePrice: true,
            salePrice: true,
            model: true,
            notes: true,
            status: true,
            stockQuantity: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return items;
}

export async function listActiveProductsForQuoteSelect(): Promise<QuoteProductOption[]> {
    const items = await prisma.product.findMany({
        where: { status: ClientStatus.ATIVO },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            model: true,
            purchasePrice: true,
            salePrice: true,
            stockQuantity: true,
        },
    });

    return items.map((product) => ({
        id: product.id,
        name: product.name,
        model: product.model,
        label: `${product.name} (${product.model})`,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        stockQuantity: product.stockQuantity,
    }));
}

export async function deleteProductById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID invalido");
    }

    const exists = await prisma.product.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!exists) {
        throw new Error("Produto nao encontrado");
    }

    await prisma.product.delete({ where: { id } });

    return { ok: true };
}
