"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export type CreateUserState = {
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
