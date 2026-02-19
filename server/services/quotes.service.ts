import { prisma } from "@/lib/prisma";
import type {
    CreateQuotePayload,
    QuoteDiscountType,
    QuoteListResult,
    QuoteListStatusFilter,
    QuoteStatus,
} from "@/types/quotes/quote";
import {
    ClientStatus,
    InventoryMovementType,
    Prisma,
    QuoteDiscountType as PrismaQuoteDiscountType,
    QuoteStatus as PrismaQuoteStatus,
} from "@prisma/client";

function clampPositiveNumber(value: number): number {
    if (!Number.isFinite(value) || value < 0) return 0;
    return value;
}

function getDiscountAmount(baseValue: number, discountType: QuoteDiscountType, discountInputValue: number): number {
    if (baseValue <= 0) return 0;

    const normalizedDiscountValue = clampPositiveNumber(discountInputValue);
    if (normalizedDiscountValue <= 0) return 0;

    if (discountType === "percent") {
        const clampedPercent = Math.min(normalizedDiscountValue, 100);
        return baseValue * (clampedPercent / 100);
    }

    return Math.min(normalizedDiscountValue, baseValue);
}

function toPrismaDiscountType(discountType: QuoteDiscountType): PrismaQuoteDiscountType {
    return discountType === "percent" ? PrismaQuoteDiscountType.PERCENT : PrismaQuoteDiscountType.AMOUNT;
}

function toPublicStatus(status: PrismaQuoteStatus): QuoteStatus {
    return status;
}

export async function listQuotesPaginated(input?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: QuoteListStatusFilter;
}): Promise<QuoteListResult> {
    const pageSize = Math.max(1, Math.min(100, Math.floor(input?.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(input?.page ?? 1));
    const search = (input?.search ?? "").trim();
    const status = input?.status ?? "ALL";

    const where: Prisma.QuoteWhereInput = {};

    if (status !== "ALL") {
        where.status = status;
    }

    if (search) {
        const searchFilters: Prisma.QuoteWhereInput[] = [
            { title: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
        ];

        const maybeId = Number(search);
        if (Number.isInteger(maybeId) && maybeId > 0) {
            searchFilters.push({ id: maybeId });
        }

        where.OR = searchFilters;
    }

    const total = await prisma.quote.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const normalizedPage = Math.min(page, totalPages);
    const skip = (normalizedPage - 1) * pageSize;

    const rows = await prisma.quote.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: pageSize,
        select: {
            id: true,
            title: true,
            status: true,
            purchaseTotal: true,
            saleGrossTotal: true,
            saleNetTotal: true,
            createdAt: true,
            soldAt: true,
            client: {
                select: {
                    name: true,
                },
            },
            _count: {
                select: {
                    items: true,
                },
            },
        },
    });

    return {
        rows: rows.map((row) => ({
            id: row.id,
            title: row.title,
            clientName: row.client.name,
            status: toPublicStatus(row.status),
            purchaseTotal: row.purchaseTotal,
            saleGrossTotal: row.saleGrossTotal,
            saleNetTotal: row.saleNetTotal,
            createdAt: row.createdAt,
            soldAt: row.soldAt,
            itemsCount: row._count.items,
        })),
        total,
        page: normalizedPage,
        pageSize,
        totalPages,
    };
}

export async function createQuote(input: CreateQuotePayload): Promise<{ quoteId: number }> {
    if (!Number.isInteger(input.clientId) || input.clientId <= 0) {
        throw new Error("Cliente invalido.");
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
        throw new Error("Adicione ao menos um item no orcamento.");
    }

    const uniqueProductIds = new Set<number>();
    for (const item of input.items) {
        if (!Number.isInteger(item.productId) || item.productId <= 0) {
            throw new Error("Produto invalido no orcamento.");
        }
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
            throw new Error("Quantidade invalida no orcamento.");
        }
        if (uniqueProductIds.has(item.productId)) {
            throw new Error("Nao e permitido repetir o mesmo produto em multiplas linhas.");
        }

        uniqueProductIds.add(item.productId);
    }

    const client = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: { id: true, status: true },
    });

    if (!client) {
        throw new Error("Cliente nao encontrado.");
    }

    if (client.status !== ClientStatus.ATIVO) {
        throw new Error("Somente clientes ativos podem receber orcamento.");
    }

    const productIds = [...uniqueProductIds];
    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            status: ClientStatus.ATIVO,
        },
        select: {
            id: true,
            purchasePrice: true,
            salePrice: true,
        },
    });

    if (products.length !== productIds.length) {
        throw new Error("Um ou mais produtos nao estao ativos ou nao existem.");
    }

    const productById = new Map(products.map((product) => [product.id, product]));

    const normalizedItems = input.items.map((item) => {
        const product = productById.get(item.productId);
        if (!product) {
            throw new Error(`Produto ${item.productId} nao encontrado.`);
        }

        const quantity = clampPositiveNumber(item.quantity);
        const purchaseUnitPrice = clampPositiveNumber(product.purchasePrice);
        const saleUnitPrice = clampPositiveNumber(product.salePrice);
        const totalPurchase = purchaseUnitPrice * quantity;
        const totalSaleGross = saleUnitPrice * quantity;
        const discountAmount = getDiscountAmount(totalSaleGross, item.discountType, item.discountValue);
        const totalSaleNet = Math.max(0, totalSaleGross - discountAmount);

        return {
            productId: item.productId,
            quantity,
            purchaseUnitPrice,
            saleUnitPrice,
            discountType: item.discountType,
            discountValue: clampPositiveNumber(item.discountValue),
            discountAmount,
            totalPurchase,
            totalSaleGross,
            totalSaleNet,
        };
    });

    const purchaseTotal = normalizedItems.reduce((acc, item) => acc + item.totalPurchase, 0);
    const saleGrossTotal = normalizedItems.reduce((acc, item) => acc + item.totalSaleGross, 0);
    const itemDiscountTotal = normalizedItems.reduce((acc, item) => acc + item.discountAmount, 0);
    const saleAfterItemDiscount = Math.max(0, saleGrossTotal - itemDiscountTotal);
    const generalDiscountAmount = getDiscountAmount(
        saleAfterItemDiscount,
        input.generalDiscountType,
        input.generalDiscountValue
    );
    const saleNetTotal = Math.max(0, saleAfterItemDiscount - generalDiscountAmount);

    const created = await prisma.quote.create({
        data: {
            title: input.title?.trim() || null,
            notes: input.notes?.trim() || null,
            clientId: input.clientId,
            status: PrismaQuoteStatus.PENDENTE,
            generalDiscountType: toPrismaDiscountType(input.generalDiscountType),
            generalDiscountValue: clampPositiveNumber(input.generalDiscountValue),
            purchaseTotal,
            saleGrossTotal,
            itemDiscountTotal,
            generalDiscountAmount,
            saleNetTotal,
            items: {
                create: normalizedItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    purchaseUnitPrice: item.purchaseUnitPrice,
                    saleUnitPrice: item.saleUnitPrice,
                    discountType: toPrismaDiscountType(item.discountType),
                    discountValue: item.discountValue,
                    discountAmount: item.discountAmount,
                    totalPurchase: item.totalPurchase,
                    totalSaleGross: item.totalSaleGross,
                    totalSaleNet: item.totalSaleNet,
                })),
            },
        },
        select: { id: true },
    });

    return { quoteId: created.id };
}

export async function markQuoteAsSold(quoteId: number): Promise<{ quoteId: number; soldAt: Date }> {
    if (!Number.isInteger(quoteId) || quoteId <= 0) {
        throw new Error("Orcamento invalido.");
    }

    const soldAt = new Date();

    return prisma.$transaction(async (tx) => {
        const quote = await tx.quote.findUnique({
            where: { id: quoteId },
            select: {
                id: true,
                status: true,
                items: {
                    select: {
                        productId: true,
                        quantity: true,
                    },
                },
            },
        });

        if (!quote) {
            throw new Error("Orcamento nao encontrado.");
        }

        if (quote.status !== PrismaQuoteStatus.PENDENTE) {
            throw new Error("Apenas orcamentos pendentes podem ser marcados como vendidos.");
        }

        if (quote.items.length === 0) {
            throw new Error("Orcamento sem itens nao pode ser vendido.");
        }

        const markAsSold = await tx.quote.updateMany({
            where: {
                id: quoteId,
                status: PrismaQuoteStatus.PENDENTE,
            },
            data: {
                status: PrismaQuoteStatus.VENDIDO,
                soldAt,
            },
        });

        if (markAsSold.count === 0) {
            throw new Error("Nao foi possivel marcar o orcamento como vendido.");
        }

        for (const item of quote.items) {
            const stockUpdate = await tx.product.updateMany({
                where: {
                    id: item.productId,
                    status: ClientStatus.ATIVO,
                    stockQuantity: {
                        gte: item.quantity,
                    },
                },
                data: {
                    stockQuantity: {
                        decrement: item.quantity,
                    },
                },
            });

            if (stockUpdate.count === 0) {
                throw new Error("Estoque insuficiente ou produto inativo para concluir a venda.");
            }

            await tx.inventoryMovement.create({
                data: {
                    movementType: InventoryMovementType.SAIDA,
                    productId: item.productId,
                    quantity: item.quantity,
                    performedAt: soldAt,
                    notes: `Saida automatica pela venda do orcamento #${quoteId}`,
                },
            });
        }

        return {
            quoteId,
            soldAt,
        };
    });
}
