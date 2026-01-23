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