"use server";

import { createQuote, markQuoteAsSold } from "@/server/services/quotes.service";
import type { CreateQuoteState, MarkQuoteAsSoldState } from "@/types/quotes/quote";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
};

const quoteDiscountTypeSchema = z.enum(["amount", "percent"]);

const quoteItemSchema = z.object({
    productId: z.number().int().positive("Produto invalido"),
    quantity: z.number().positive("Quantidade invalida"),
    discountType: quoteDiscountTypeSchema,
    discountValue: z.number().min(0, "Desconto invalido"),
});

const createQuoteSchema = z.object({
    clientId: z.number().int().positive("Selecione um cliente"),
    title: z.preprocess(emptyToUndefined, z.string().max(200, "Titulo muito longo").optional()),
    notes: z.preprocess(emptyToUndefined, z.string().max(2000, "Observacao muito longa").optional()),
    generalDiscountType: quoteDiscountTypeSchema,
    generalDiscountValue: z.number().min(0, "Desconto geral invalido"),
    items: z.array(quoteItemSchema).min(1, "Adicione ao menos um item"),
});

const markAsSoldSchema = z.object({
    quoteId: z.number().int().positive("Orcamento invalido"),
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
            message: "Dados do orcamento invalidos.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await createQuote(parsed.data);

        revalidatePath("/quotes-sales");

        return {
            ok: true,
            message: "Orcamento finalizado como pendente.",
            quoteId: result.quoteId,
        };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Nao foi possivel finalizar o orcamento.",
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
            message: "Orcamento invalido.",
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
            message: "Orcamento marcado como vendido e estoque atualizado.",
            quoteId: result.quoteId,
        };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : "Nao foi possivel marcar como vendido.",
        };
    }
}
