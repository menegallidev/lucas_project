"use server";

import { prisma } from "@/lib/prisma";
import { deleteUserById } from "@/server/services/users.service";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type CreateUserState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};

export type DeleteUserState = {
    ok: boolean;
    message?: string;
    attempt: number;
};

export type UpdateUserState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};

const createUserSchema = z
    .object({
        name: z.string().min(2, "Nome muito curto"),
        cpf: z.string().min(11, "CPF inválido"),
        password: z.string().min(6, "Senha muito curta"),
        passwordConfirm: z.string().min(6, "Confirme a senha"),
    })
    .refine((d) => d.password === d.passwordConfirm, {
        path: ["passwordConfirm"],
        message: "As senhas não coincidem",
    });

const deleteSchema = z.object({
    id: z.number().int().positive(),
});

const updateUserSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(2, "Nome muito curto"),
    cpf: z.string().min(11, "CPF inválido"),

    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
}).refine(
    (d) => {
        const p = (d.password ?? "").trim();
        const pc = (d.passwordConfirm ?? "").trim();

        if (!p && !pc) return true;

        if (p.length < 6) return false;
        return p === pc;
    },
    {
        path: ["passwordConfirm"],
        message: "Para alterar a senha, preencha as duas e elas devem coincidir (mín. 6 caracteres).",
    }
);

export async function createUserAction(prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
    const raw = {
        name: String(formData.get("name") ?? "").trim(),
        cpf: String(formData.get("cpf") ?? "").replace(/\D/g, ""),
        password: String(formData.get("password") ?? ""),
        passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    };

    const parsed = createUserSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const cpf = parsed.data.cpf;

    const exists = await prisma.user.findFirst({
        where: { cpf },
        select: { id: true },
    });

    if (exists) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: { cpf: ["CPF já cadastrado"] },
        };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await prisma.user.create({
        data: {
            name: parsed.data.name,
            cpf,
            passwordHash,
        },
    });

    return { ok: true, attempt: prev.attempt + 1, message: "Usuário criado com sucesso!" };
}

export async function deleteUserAction(
    prev: DeleteUserState,
    formData: FormData
): Promise<DeleteUserState> {
    const rawId = Number(formData.get("id"));

    console.log({ rawId });

    const parsed = deleteSchema.safeParse({ id: rawId });
    if (!parsed.success) {
        return { ok: false, message: "ID inválido.", attempt: prev.attempt + 1 };
    }

    try {
        await deleteUserById(parsed.data.id);

        revalidatePath("/users");

        return { ok: true, message: "Usuário excluído com sucesso!", attempt: prev.attempt + 1 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return {
            ok: false,
            message: e?.message ?? "Não foi possível excluir o usuário.",
            attempt: prev.attempt + 1,
        };
    }
}

export async function findUserById(id: number) {
    if (!id) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, cpf: true, name: true }
    });

    if (!user) {
        return null;
    }

    return user;
}

export async function updateUserAction(
    prev: UpdateUserState,
    formData: FormData
): Promise<UpdateUserState> {
    const raw = {
        id: Number(formData.get("id")),
        name: String(formData.get("name") ?? "").trim(),
        cpf: String(formData.get("cpf") ?? "").replace(/\D/g, ""),
        password: String(formData.get("password") ?? ""),
        passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    };

    const parsed = updateUserSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const exists = await prisma.user.findFirst({
        where: { cpf: parsed.data.cpf, NOT: { id: parsed.data.id } },
        select: { id: true },
    });

    if (exists) {
        return {
            ok: false,
            attempt: prev.attempt + 1,
            fieldErrors: { cpf: ["CPF já cadastrado"] },
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
        name: parsed.data.name,
        cpf: parsed.data.cpf,
    };

    const newPassword = (parsed.data.password ?? "").trim();
    if (newPassword) {
        data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
        where: { id: parsed.data.id },
        data,
    });

    revalidatePath("/users");
    revalidatePath(`/users/${parsed.data.id}`);

    redirect("/users");
}
