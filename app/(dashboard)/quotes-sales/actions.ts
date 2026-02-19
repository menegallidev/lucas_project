"use server";

import { createQuote, deleteQuote, markQuoteAsSold } from "@/server/services/quotes.service";
import type { CreateQuoteState, DeleteQuoteState, MarkQuoteAsSoldState } from "@/types/quotes/quote";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
};

const quoteDiscountTypeSchema = z.enum(["amount", "percent"]);

const quoteItemSchema = z.object({
    productId: z.number().int().positive("Produto inválido"),
    quantity: z.number().positive("Quantidade inválida"),
    discountType: quoteDiscountTypeSchema,
    discountValue: z.number().min(0, "Desconto inválido"),
});

const createQuoteSchema = z.object({
    clientId: z.number().int().positive("Selecione um cliente"),
    title: z.preprocess(emptyToUndefined, z.string().max(200, "Título muito longo").nullable().optional()),
    notes: z.preprocess(emptyToUndefined, z.string().max(2000, "Observação muito longa").nullable().optional()),
    generalDiscountType: quoteDiscountTypeSchema,
    generalDiscountValue: z.number().min(0, "Desconto geral inválido"),
    items: z.array(quoteItemSchema).min(1, "Adicione ao menos um item"),
});

const markAsSoldSchema = z.object({
    quoteId: z.number().int().positive("Orçamento inválido"),
});

function parsePayload(rawPayload: string): unknown {
    try {
        return JSON.parse(rawPayload);
    } catch {
        return null;
    }
}

export async function createQuoteAction(formData: FormData): Promise<CreateQuoteState> {
    const payloadRaw = String(formData.get("payload") ?? "");
    const payload = parsePayload(payloadRaw);

    const parsed = createQuoteSchema.safeParse(payload);
    if (!parsed.success) {
        return {
            ok: false,
            message: "Dados do orçamento inválidos.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await createQuote(parsed.data);

        revalidatePath("/quotes-sales");

        return {
            ok: true,
            message: "Orçamento finalizado como pendente.",
            quoteId: result.quoteId,
        };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Não foi possível finalizar o orçamento.",
        };
    }
}

export async function markQuoteAsSoldAction(formData: FormData): Promise<MarkQuoteAsSoldState> {
    const parsed = markAsSoldSchema.safeParse({
        quoteId: Number(formData.get("quoteId")),
    });

    if (!parsed.success) {
        return {
            ok: false,
            message: "Orçamento inválido.",
        };
    }

    try {
        const result = await markQuoteAsSold(parsed.data.quoteId);

        revalidatePath("/quotes-sales");
        revalidatePath("/inventory");
        revalidatePath("/products");
        revalidatePath("/dashboard");

        return {
            ok: true,
            message: "Orçamento marcado como vendido e estoque atualizado.",
            quoteId: result.quoteId,
        };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Não foi possível marcar como vendido.",
        };
    }
}

export async function deleteQuoteAction(formData: FormData): Promise<DeleteQuoteState> {
    const parsed = markAsSoldSchema.safeParse({
        quoteId: Number(formData.get("quoteId")),
    });

    if (!parsed.success) {
        return {
            ok: false,
            message: "Orçamento inválido.",
        };
    }

    try {
        const result = await deleteQuote(parsed.data.quoteId);

        revalidatePath("/quotes-sales");
        revalidatePath("/dashboard");

        return {
            ok: true,
            message: "Orçamento excluído com sucesso.",
            quoteId: result.quoteId,
        };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Não foi possível excluir o orçamento.",
        };
    }
}
