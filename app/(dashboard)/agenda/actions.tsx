"use server";

import { prisma } from "@/lib/prisma";
import { listAgendaEventsByMonth, deleteAgendaEventById } from "@/server/services/agenda.service";
import type { CreateAgendaEventState, UpdateAgendaEventState, DeleteAgendaEventState } from "@/types/agenda/event";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
};

const baseSchema = z.object({
    title: z.string().min(2, "Título muito curto"),
    date: z.string().min(10, "Data inválida"),
    time: z.preprocess(emptyToUndefined, z.string().optional()),
    clientId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    location: z.preprocess(emptyToUndefined, z.string().optional()),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

const createSchema = baseSchema;

const updateSchema = baseSchema.extend({
    id: z.number().int().positive(),
});

const deleteSchema = z.object({
    id: z.number().int().positive(),
});

function buildStartAt(date: string, time?: string) {
    const [year, month, day] = date.split("-").map(Number);
    const [h, m] = (time ?? "00:00").split(":").map(Number);
    return new Date(year, month - 1, day, h || 0, m || 0, 0);
}

export async function listEventsByMonthAction(year: number, month: number) {
    return listAgendaEventsByMonth(year, month);
}

export async function createAgendaEventAction(
    prev: CreateAgendaEventState,
    formData: FormData
): Promise<CreateAgendaEventState> {
    const raw = {
        title: String(formData.get("title") ?? "").trim(),
        date: String(formData.get("date") ?? "").trim(),
        time: String(formData.get("time") ?? "").trim(),
        clientId: String(formData.get("clientId") ?? "").trim(),
        location: String(formData.get("location") ?? "").trim(),
        notes: String(formData.get("notes") ?? "").trim(),
    };

    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    await prisma.agendaEvent.create({
        data: {
            title: parsed.data.title,
            startAt: buildStartAt(parsed.data.date, parsed.data.time),
            clientId: parsed.data.clientId ?? null,
            location: parsed.data.location ?? null,
            notes: parsed.data.notes ?? null,
        },
    });

    revalidatePath("/agenda");

    return { ok: true, attempt: prev.attempt + 1, message: "Evento criado com sucesso!" };
}

export async function updateAgendaEventAction(
    prev: UpdateAgendaEventState,
    formData: FormData
): Promise<UpdateAgendaEventState> {
    const raw = {
        id: Number(formData.get("id")),
        title: String(formData.get("title") ?? "").trim(),
        date: String(formData.get("date") ?? "").trim(),
        time: String(formData.get("time") ?? "").trim(),
        clientId: String(formData.get("clientId") ?? "").trim(),
        location: String(formData.get("location") ?? "").trim(),
        notes: String(formData.get("notes") ?? "").trim(),
    };

    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    await prisma.agendaEvent.update({
        where: { id: parsed.data.id },
        data: {
            title: parsed.data.title,
            startAt: buildStartAt(parsed.data.date, parsed.data.time),
            clientId: parsed.data.clientId ?? null,
            location: parsed.data.location ?? null,
            notes: parsed.data.notes ?? null,
        },
    });

    revalidatePath("/agenda");

    return { ok: true, attempt: prev.attempt + 1, message: "Evento atualizado com sucesso!" };
}

export async function deleteAgendaEventAction(
    prev: DeleteAgendaEventState,
    formData: FormData
): Promise<DeleteAgendaEventState> {
    const rawId = Number(formData.get("id"));

    const parsed = deleteSchema.safeParse({ id: rawId });
    if (!parsed.success) {
        return { ok: false, message: "ID inválido.", attempt: prev.attempt + 1 };
    }

    try {
        await deleteAgendaEventById(parsed.data.id);
        revalidatePath("/agenda");
        return { ok: true, message: "Evento excluído com sucesso!", attempt: prev.attempt + 1 };
    } catch (e: any) {
        return {
            ok: false,
            message: e?.message ?? "Não foi possível excluir o evento.",
            attempt: prev.attempt + 1,
        };
    }
}
