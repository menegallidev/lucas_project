"use server";

import { prisma } from "@/lib/prisma";
import { deleteClientById } from "@/server/services/clients.service";
import { CreateClientState, DeleteClientState, UpdateClientState } from "@/types/clients/client";
import { ClientStatus, TipoPessoa } from "@prisma/client";
import { isValidCpfCnpj } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ClientDTO = {
    id: number;
    personType: TipoPessoa;
    name: string;
    tradeName: string | null;
    document: string | null;
    stateTaxId: string | null;
    companyId: number | null;
    email: string | null;
    phone1: string;
    phone2: string | null;
    whatsapp: string | null;
    zipCode: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    referencePoint: string | null;
    paymentTerms: string | null;
    notes: string | null;
    status: ClientStatus;
};

const emptyToUndefined = (value: unknown) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
};

const createClientSchema = z.object({
    personType: z.preprocess(emptyToUndefined, z.nativeEnum(TipoPessoa)),
    name: z.string().min(2, "Nome muito curto"),
    tradeName: z.preprocess(emptyToUndefined, z.string().min(2, "Nome fantasia muito curto").optional()),
    document: z.preprocess(emptyToUndefined, z.string().optional()).refine(
        (value) => {
            if (!value) return true;
            return isValidCpfCnpj(value);
        },
        { message: "CPF/CNPJ invalido" }
    ),
    stateTaxId: z.preprocess(emptyToUndefined, z.string().optional()),
    companyId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    email: z.preprocess(emptyToUndefined, z.string().email("Email invalido").optional()),
    phone1: z.string().min(8, "Telefone invalido"),
    phone2: z.preprocess(emptyToUndefined, z.string().min(8, "Telefone invalido").optional()),
    whatsapp: z.preprocess(emptyToUndefined, z.string().min(8, "Telefone invalido").optional()),
    zipCode: z.preprocess(emptyToUndefined, z.string().min(8, "CEP invalido").optional()),
    street: z.preprocess(emptyToUndefined, z.string().min(2, "Logradouro invalido").optional()),
    number: z.preprocess(emptyToUndefined, z.string().min(1, "Numero obrigatorio").optional()),
    complement: z.preprocess(emptyToUndefined, z.string().optional()),
    neighborhood: z.preprocess(emptyToUndefined, z.string().min(2, "Bairro invalido").optional()),
    city: z.preprocess(emptyToUndefined, z.string().min(2, "Cidade invalida").optional()),
    state: z.preprocess(emptyToUndefined, z.string().min(2, "UF invalida").max(2, "UF invalida").optional()),
    referencePoint: z.preprocess(emptyToUndefined, z.string().optional()),
    paymentTerms: z.preprocess(emptyToUndefined, z.string().optional()),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

const updateClientSchema = createClientSchema.extend({
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

function extractClientInput(formData: FormData) {
    return {
        personType: normalizeText(formData.get("personType")),
        name: normalizeText(formData.get("name")),
        tradeName: normalizeText(formData.get("tradeName")),
        document: normalizeDigits(formData.get("document")),
        stateTaxId: normalizeText(formData.get("stateTaxId")),
        companyId: normalizeText(formData.get("companyId")),
        email: normalizeText(formData.get("email")),
        phone1: normalizeDigits(formData.get("phone1")),
        phone2: normalizeDigits(formData.get("phone2")),
        whatsapp: normalizeDigits(formData.get("whatsapp")),
        zipCode: normalizeDigits(formData.get("zipCode")),
        street: normalizeText(formData.get("street")),
        number: normalizeText(formData.get("number")),
        complement: normalizeText(formData.get("complement")),
        neighborhood: normalizeText(formData.get("neighborhood")),
        city: normalizeText(formData.get("city")),
        state: normalizeText(formData.get("state")).toUpperCase(),
        referencePoint: normalizeText(formData.get("referencePoint")),
        paymentTerms: normalizeText(formData.get("paymentTerms")),
        notes: normalizeText(formData.get("notes")),
        status: normalizeText(formData.get("status")),
    };
}

export async function createClientAction(prev: CreateClientState, formData: FormData): Promise<CreateClientState> {
    const raw = extractClientInput(formData);

    const parsed = createClientSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    if (parsed.data.document) {
        const exists = await prisma.client.findFirst({
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

    await prisma.client.create({
        data: {
            personType: parsed.data.personType,
            name: parsed.data.name,
            tradeName: parsed.data.tradeName ?? null,
            document: parsed.data.document ?? null,
            stateTaxId: parsed.data.stateTaxId ?? null,
            companyId: parsed.data.companyId ?? null,
            email: parsed.data.email ?? null,
            phone1: parsed.data.phone1,
            phone2: parsed.data.phone2 ?? null,
            whatsapp: parsed.data.whatsapp ?? null,
            zipCode: parsed.data.zipCode ?? "",
            street: parsed.data.street ?? "",
            number: parsed.data.number ?? "",
            complement: parsed.data.complement ?? null,
            neighborhood: parsed.data.neighborhood ?? "",
            city: parsed.data.city ?? "",
            state: parsed.data.state ?? "",
            referencePoint: parsed.data.referencePoint ?? null,
            paymentTerms: parsed.data.paymentTerms ?? null,
            notes: parsed.data.notes ?? null,
        },
    });

    return { ok: true, attempt: prev.attempt + 1, message: "Cliente criado com sucesso!" };
}

export async function deleteClientAction(prev: DeleteClientState, formData: FormData): Promise<DeleteClientState> {
    const rawId = Number(formData.get("id"));

    const parsed = deleteSchema.safeParse({ id: rawId });
    if (!parsed.success) {
        return { ok: false, message: "ID invalido.", attempt: prev.attempt + 1 };
    }

    try {
        await deleteClientById(parsed.data.id);

        revalidatePath("/clients");

        return { ok: true, message: "Cliente excluido com sucesso!", attempt: prev.attempt + 1 };
    } catch (e: any) {
        return {
            ok: false,
            message: e?.message ?? "Nao foi possivel excluir o cliente.",
            attempt: prev.attempt + 1,
        };
    }
}

export async function findClientById(id: number): Promise<ClientDTO | null> {
    if (!id) return null;

    const client = await prisma.client.findUnique({
        where: { id },
        select: {
            id: true,
            personType: true,
            name: true,
            tradeName: true,
            document: true,
            stateTaxId: true,
            companyId: true,
            email: true,
            phone1: true,
            phone2: true,
            whatsapp: true,
            zipCode: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            referencePoint: true,
            paymentTerms: true,
            notes: true,
            status: true,
        },
    });

    return client ?? null;
}

export async function updateClientAction(prev: UpdateClientState, formData: FormData): Promise<UpdateClientState> {
    const raw = {
        id: Number(formData.get("id")),
        ...extractClientInput(formData),
    };

    const parsed = updateClientSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    if (parsed.data.document) {
        const exists = await prisma.client.findFirst({
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

    const data: any = {
        personType: parsed.data.personType,
        name: parsed.data.name,
        tradeName: parsed.data.tradeName ?? null,
        document: parsed.data.document ?? null,
        stateTaxId: parsed.data.stateTaxId ?? null,
        companyId: parsed.data.companyId ?? null,
        email: parsed.data.email ?? null,
        phone1: parsed.data.phone1,
        phone2: parsed.data.phone2 ?? null,
        whatsapp: parsed.data.whatsapp ?? null,
        zipCode: parsed.data.zipCode ?? "",
        street: parsed.data.street ?? "",
        number: parsed.data.number ?? "",
        complement: parsed.data.complement ?? null,
        neighborhood: parsed.data.neighborhood ?? "",
        city: parsed.data.city ?? "",
        state: parsed.data.state ?? "",
        referencePoint: parsed.data.referencePoint ?? null,
        paymentTerms: parsed.data.paymentTerms ?? null,
        notes: parsed.data.notes ?? null,
    };

    if (parsed.data.status) data.status = parsed.data.status;

    await prisma.client.update({
        where: { id: parsed.data.id },
        data,
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${parsed.data.id}`);

    return {
        ok: true,
        attempt: prev.attempt + 1,
        message: "Cliente atualizado com sucesso!",
    };
}
