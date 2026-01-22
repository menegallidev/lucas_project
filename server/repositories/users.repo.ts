import { prisma } from "@/lib/prisma";

export const usersRepo = {
    async findMany(search: string) {
        return prisma.user.findMany({
            where: search
                ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { cpf: { contains: search } },
                    ],
                }
                : undefined,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                cpf: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },
};