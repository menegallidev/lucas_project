"use server";

import { prisma } from "@/lib/prisma";
import { deleteProductById } from "@/server/services/products.service";
import { CreateProductState, DeleteProductState, UpdateProductState } from "@/types/products/product";
import { ClientStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ProductDTO = {
    id: number;
    name: string;
    purchasePrice: number;
    salePrice: number;
    model: string;
    notes: string | null;
    status: ClientStatus;
    stockQuantity: number;
};

const emptyToUndefined = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
};

const createProductSchema = z.object({
    name: z.string().min(2, "Nome muito curto"),
    purchasePrice: z.number().min(0, "Valor de compra invalido"),
    salePrice: z.number().min(0, "Valor de venda invalido"),
    model: z.string().min(1, "Modelo obrigatorio"),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

const updateProductSchema = createProductSchema.extend({
    id: z.number().int().positive(),
    status: z.preprocess(emptyToUndefined, z.nativeEnum(ClientStatus).optional()),
});

const deleteSchema = z.object({
    id: z.number().int().positive(),
});

function normalizeText(value: FormDataEntryValue | null | undefined) {
    return String(value ?? "").trim();
}

function normalizePrice(value: FormDataEntryValue | null | undefined) {
    const raw = normalizeText(value);
    if (!raw) return "";

    const cleaned = raw.replace(/[^\d,.-]/g, "");
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const sepIndex = Math.max(lastComma, lastDot);

    if (sepIndex < 0) {
        const onlyInt = cleaned.replace(/\D/g, "");
        return onlyInt ? `${onlyInt}.00` : "";
    }

    const intPart = cleaned.slice(0, sepIndex).replace(/\D/g, "");
    const fracPart = cleaned.slice(sepIndex + 1).replace(/\D/g, "").slice(0, 2);

    return `${intPart || "0"}.${fracPart.padEnd(2, "0")}`;
}

function extractProductInput(formData: FormData) {
    return {
        name: normalizeText(formData.get("name")),
        purchasePrice: Number(normalizePrice(formData.get("purchasePrice"))),
        salePrice: Number(normalizePrice(formData.get("salePrice"))),
        model: normalizeText(formData.get("model")),
        notes: normalizeText(formData.get("notes")),
        status: normalizeText(formData.get("status")),
    };
}

export async function createProductAction(prev: CreateProductState, formData: FormData): Promise<CreateProductState> {
    const raw = extractProductInput(formData);

    const parsed = createProductSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    await prisma.product.create({
        data: {
            name: parsed.data.name,
            purchasePrice: parsed.data.purchasePrice,
            salePrice: parsed.data.salePrice,
            model: parsed.data.model,
            notes: parsed.data.notes ?? null,
        },
    });

    return { ok: true, attempt: prev.attempt + 1, message: "Produto criado com sucesso!" };
}

export async function deleteProductAction(prev: DeleteProductState, formData: FormData): Promise<DeleteProductState> {
    const rawId = Number(formData.get("id"));

    const parsed = deleteSchema.safeParse({ id: rawId });
    if (!parsed.success) {
        return { ok: false, message: "ID invalido.", attempt: prev.attempt + 1 };
    }

    try {
        await deleteProductById(parsed.data.id);

        revalidatePath("/products");

        return { ok: true, message: "Produto excluido com sucesso!", attempt: prev.attempt + 1 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return {
            ok: false,
            message: e?.message ?? "Nao foi possivel excluir o produto.",
            attempt: prev.attempt + 1,
        };
    }
}

export async function findProductById(id: number): Promise<ProductDTO | null> {
    if (!id) return null;

    const product = await prisma.product.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            purchasePrice: true,
            salePrice: true,
            model: true,
            notes: true,
            status: true,
            stockQuantity: true,
        },
    });

    return product ?? null;
}

export async function updateProductAction(prev: UpdateProductState, formData: FormData): Promise<UpdateProductState> {
    const raw = {
        id: Number(formData.get("id")),
        ...extractProductInput(formData),
    };

    const parsed = updateProductSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    await prisma.product.update({
        where: { id: parsed.data.id },
        data: {
            name: parsed.data.name,
            purchasePrice: parsed.data.purchasePrice,
            salePrice: parsed.data.salePrice,
            model: parsed.data.model,
            notes: parsed.data.notes ?? null,
            status: parsed.data.status ?? undefined,
        },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${parsed.data.id}`);

    return {
        ok: true,
        attempt: prev.attempt + 1,
        message: "Produto atualizado com sucesso!",
    };
}
