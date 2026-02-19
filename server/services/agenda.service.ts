import { prisma } from "@/lib/prisma";
import { getAppDayRange, getAppMonthRange } from "@/lib/date-time";
import { AgendaEventRow } from "@/types/agenda/event";
import { ClientStatus } from "@prisma/client";

export async function listActiveClientsForSelect() {
    return prisma.client.findMany({
        where: { status: ClientStatus.ATIVO },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });
}

export async function listAgendaEventsByMonth(year: number, month: number): Promise<AgendaEventRow[]> {
    const { start, end } = getAppMonthRange(year, month);

    const items = await prisma.agendaEvent.findMany({
        where: {
            startAt: {
                gte: start,
                lt: end,
            },
        },
        orderBy: { startAt: "asc" },
        select: {
            id: true,
            title: true,
            startAt: true,
            location: true,
            notes: true,
            clientId: true,
            client: { select: { name: true } },
        },
    });

    return items.map((item) => ({
        id: item.id,
        title: item.title,
        startAt: item.startAt,
        location: item.location,
        notes: item.notes,
        clientId: item.clientId,
        clientName: item.client?.name ?? null,
    }));
}

export async function listAgendaEventsByDay(date: Date): Promise<AgendaEventRow[]> {
    const { start, end } = getAppDayRange(date);

    const items = await prisma.agendaEvent.findMany({
        where: {
            startAt: {
                gte: start,
                lt: end,
            },
        },
        orderBy: { startAt: "asc" },
        select: {
            id: true,
            title: true,
            startAt: true,
            location: true,
            notes: true,
            clientId: true,
            client: { select: { name: true } },
        },
    });

    return items.map((item) => ({
        id: item.id,
        title: item.title,
        startAt: item.startAt,
        location: item.location,
        notes: item.notes,
        clientId: item.clientId,
        clientName: item.client?.name ?? null,
    }));
}

export async function deleteAgendaEventById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID inválido");
    }

    const exists = await prisma.agendaEvent.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!exists) {
        throw new Error("Evento não encontrado");
    }

    await prisma.agendaEvent.delete({ where: { id } });

    return { ok: true };
}
