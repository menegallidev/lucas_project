"use server";

import { createInventoryMovement } from "@/server/services/inventory.service";
import { parseDateTimeLocalInAppTimeZone } from "@/lib/date-time";
import type { CreateInventoryMovementState } from "@/types/inventory/movement";
import { InventoryMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
};

const createMovementSchema = z.object({
    movementType: z.preprocess(emptyToUndefined, z.nativeEnum(InventoryMovementType)),
    productId: z.coerce.number().int().positive("Selecione um produto"),
    quantity: z.coerce.number().positive("Informe uma quantidade valida"),
    performedAt: z.string().min(1, "Informe a data e hora"),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

function normalizeText(value: FormDataEntryValue | null | undefined) {
    return String(value ?? "").trim();
}

function normalizeNumber(value: FormDataEntryValue | null | undefined) {
    return normalizeText(value).replace(",", ".");
}

export async function createInventoryMovementAction(
    prev: CreateInventoryMovementState,
    formData: FormData
): Promise<CreateInventoryMovementState> {
    const raw = {
        movementType: normalizeText(formData.get("movementType")),
        productId: normalizeText(formData.get("productId")),
        quantity: normalizeNumber(formData.get("quantity")),
        performedAt: normalizeText(formData.get("performedAt")),
        notes: normalizeText(formData.get("notes")),
    };

    const parsed = createMovementSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const performedAtDate = parseDateTimeLocalInAppTimeZone(parsed.data.performedAt);
    if (!performedAtDate) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: { performedAt: ["Data e hora invalidas"] },
        };
    }

    try {
        await createInventoryMovement({
            movementType: parsed.data.movementType,
            productId: parsed.data.productId,
            quantity: parsed.data.quantity,
            performedAt: performedAtDate,
            notes: parsed.data.notes ?? null,
        });

        revalidatePath("/inventory");
        revalidatePath("/products");

        return {
            ok: true,
            attempt: prev.attempt + 1,
            message: "Movimentacao registrada com sucesso!",
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            message: e?.message ?? "Nao foi possivel registrar a movimentacao.",
        };
    }
}
