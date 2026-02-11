import { prisma } from "@/lib/prisma";
import { ProductRow } from "@/types/products/productRow";

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
            price: true,
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
