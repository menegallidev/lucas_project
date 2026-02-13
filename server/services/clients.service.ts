import { prisma } from "@/lib/prisma";
import { ClientRow } from "@/types/clients/clientRow";

export async function listClientsBySearch(search?: string, companyId?: number): Promise<ClientRow[]> {
    const formattedSearch: string = (search ?? "").trim();
    const where = {
        ...(formattedSearch
            ? {
                OR: [
                    { name: { contains: formattedSearch, mode: "insensitive" as const } },
                    { tradeName: { contains: formattedSearch, mode: "insensitive" as const } },
                    { document: { contains: formattedSearch } },
                    { email: { contains: formattedSearch, mode: "insensitive" as const } },
                    { phone1: { contains: formattedSearch } },
                    { city: { contains: formattedSearch, mode: "insensitive" as const } },
                ],
            }
            : {}),
        ...(Number.isInteger(companyId) && (companyId ?? 0) > 0 ? { companyId } : {}),
    };

    const items = await prisma.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            personType: true,
            name: true,
            company: { select: { name: true } },
            tradeName: true,
            document: true,
            email: true,
            phone1: true,
            city: true,
            state: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return items.map((item) => ({
        id: item.id,
        personType: item.personType,
        name: item.name,
        companyName: item.company?.name ?? null,
        tradeName: item.tradeName,
        document: item.document,
        email: item.email,
        phone1: item.phone1,
        city: item.city,
        state: item.state,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }));
}

export async function deleteClientById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID invalido");
    }

    const exists = await prisma.client.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!exists) {
        throw new Error("Cliente nao encontrado");
    }

    await prisma.client.delete({ where: { id } });

    return { ok: true };
}
