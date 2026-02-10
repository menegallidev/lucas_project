"use server";

import { prisma } from "@/lib/prisma";
import { deleteCompanyById } from "@/server/services/companies.service";
import { CreateCompanyState, DeleteCompanyState, UpdateCompanyState } from "@/types/companies/company";
import { ClientStatus } from "@prisma/client";
import { isValidCpfCnpj } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CompanyDTO = {
    id: number;
    name: string;
    tradeName: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    status: ClientStatus;
};

const emptyToUndefined = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
};

const createCompanySchema = z.object({
    name: z.string().min(2, "Nome muito curto"),
    tradeName: z.preprocess(emptyToUndefined, z.string().min(2, "Nome fantasia muito curto").optional()),
    document: z.preprocess(emptyToUndefined, z.string().optional()).refine(
        (value) => {
            if (!value) return true;
            return isValidCpfCnpj(value);
        },
        { message: "CPF/CNPJ invalido" }
    ),
    email: z.preprocess(emptyToUndefined, z.string().email("Email invalido").optional()),
    phone: z.preprocess(emptyToUndefined, z.string().min(8, "Telefone invalido").optional()),
});

const updateCompanySchema = createCompanySchema.extend({
    id: z.number().int().positive(),
    status: z.preprocess(emptyToUndefined, z.nativeEnum(ClientStatus).optional()),
});

const deleteSchema = z.object({
    id: z.number().int().positive(),
});

function normalizeText(value: FormDataEntryValue | null | undefined) {
    return String(value ?? "").trim();
}

function normalizeDigits(value: FormDataEntryValue | null | undefined) {
    return normalizeText(value).replace(/\D/g, "");
}

function extractCompanyInput(formData: FormData) {
    return {
        name: normalizeText(formData.get("name")),
        tradeName: normalizeText(formData.get("tradeName")),
        document: normalizeDigits(formData.get("document")),
        email: normalizeText(formData.get("email")),
        phone: normalizeDigits(formData.get("phone")),
        status: normalizeText(formData.get("status")),
    };
}

export async function createCompanyAction(prev: CreateCompanyState, formData: FormData): Promise<CreateCompanyState> {
    const raw = extractCompanyInput(formData);

    const parsed = createCompanySchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    if (parsed.data.document) {
        const exists = await prisma.company.findFirst({
            where: { document: parsed.data.document },
            select: { id: true },
        });

        if (exists) {
            return {
                ok: false,
                attempt: prev.attempt + 1,
                fieldErrors: { document: ["Documento ja cadastrado"] },
            };
        }
    }

    await prisma.company.create({
        data: {
            name: parsed.data.name,
            tradeName: parsed.data.tradeName ?? null,
            document: parsed.data.document ?? null,
            email: parsed.data.email ?? null,
            phone: parsed.data.phone ?? null,
        },
    });

    return { ok: true, attempt: prev.attempt + 1, message: "Empresa criada com sucesso!" };
}

export async function deleteCompanyAction(prev: DeleteCompanyState, formData: FormData): Promise<DeleteCompanyState> {
    const rawId = Number(formData.get("id"));

    const parsed = deleteSchema.safeParse({ id: rawId });
    if (!parsed.success) {
        return { ok: false, message: "ID invalido.", attempt: prev.attempt + 1 };
    }

    try {
        await deleteCompanyById(parsed.data.id);

        revalidatePath("/companies");

        return { ok: true, message: "Empresa excluida com sucesso!", attempt: prev.attempt + 1 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return {
            ok: false,
            message: e?.message ?? "Nao foi possivel excluir a empresa.",
            attempt: prev.attempt + 1,
        };
    }
}

export async function findCompanyById(id: number): Promise<CompanyDTO | null> {
    if (!id) return null;

    const company = await prisma.company.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            tradeName: true,
            document: true,
            email: true,
            phone: true,
            status: true,
        },
    });

    return company ?? null;
}

export async function updateCompanyAction(prev: UpdateCompanyState, formData: FormData): Promise<UpdateCompanyState> {
    const raw = {
        id: Number(formData.get("id")),
        ...extractCompanyInput(formData),
    };

    const parsed = updateCompanySchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    if (parsed.data.document) {
        const exists = await prisma.company.findFirst({
            where: { document: parsed.data.document, NOT: { id: parsed.data.id } },
            select: { id: true },
        });

        if (exists) {
            return {
                ok: false,
                attempt: prev.attempt + 1,
                fieldErrors: { document: ["Documento ja cadastrado"] },
            };
        }
    }

    await prisma.company.update({
        where: { id: parsed.data.id },
        data: {
            name: parsed.data.name,
            tradeName: parsed.data.tradeName ?? null,
            document: parsed.data.document ?? null,
            email: parsed.data.email ?? null,
            phone: parsed.data.phone ?? null,
            status: parsed.data.status ?? undefined,
        },
    });

    revalidatePath("/companies");
    revalidatePath(`/companies/${parsed.data.id}`);

    return {
        ok: true,
        attempt: prev.attempt + 1,
        message: "Empresa atualizada com sucesso!",
    };
}
