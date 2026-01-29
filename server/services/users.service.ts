import { prisma } from "@/lib/prisma";

export async function listUsersBySearch(search?: string) {
    const formattedSearch: string = (search ?? "").trim();

    const items = prisma.user.findMany({
        where: formattedSearch
            ? {
                OR: [
                    { name: { contains: formattedSearch, mode: "insensitive" } },
                    { cpf: { contains: formattedSearch } },
                ],
            }
            : undefined,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, cpf: true, createdAt: true, updatedAt: true },
    });

    return items;
}

export async function deleteUserById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID inválido");
    }

    const exists = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!exists) {
        throw new Error("Usuário não encontrado");
    }

    await prisma.user.delete({ where: { id } });

    return { ok: true };
}