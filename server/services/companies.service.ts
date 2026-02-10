import { prisma } from "@/lib/prisma";
import { CompanyRow } from "@/types/companies/companyRow";

export async function listCompaniesBySearch(search?: string): Promise<CompanyRow[]> {
    const formattedSearch: string = (search ?? "").trim();

    const items = prisma.company.findMany({
        where: formattedSearch
            ? {
                OR: [
                    { name: { contains: formattedSearch, mode: "insensitive" } },
                    { tradeName: { contains: formattedSearch, mode: "insensitive" } },
                    { document: { contains: formattedSearch } },
                    { email: { contains: formattedSearch, mode: "insensitive" } },
                    { phone: { contains: formattedSearch } },
                ],
            }
            : undefined,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            tradeName: true,
            document: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return items;
}

export async function listCompaniesForSelect(): Promise<Array<{ id: number; name: string }>> {
    const items = prisma.company.findMany({
        orderBy: { name: "asc" },
        where: { status: "ATIVO" },
        select: { id: true, name: true },
    });

    return items;
}

export async function deleteCompanyById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID invalido");
    }

    const exists = await prisma.company.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!exists) {
        throw new Error("Empresa nao encontrada");
    }

    await prisma.company.delete({ where: { id } });

    return { ok: true };
}
