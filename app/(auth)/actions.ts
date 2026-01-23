"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export type LoginState = { ok: boolean; message?: string; attempt: number };

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const cpf = String(formData.get("cpf") ?? "").replace(/\D/g, "");
    const password = String(formData.get("password") ?? "");

    if (!cpf || !password) {
        return {
            ok: false,
            message: "CPF e senha são obrigatórios.",
            attempt: prevState.attempt + 1,
        };
    }

    const user = await prisma.user.findFirst({
        where: { cpf },
        select: { id: true, passwordHash: true },
    });

    if (!user) {
        return {
            ok: false,
            message: "CPF ou senha incorretos.",
            attempt: prevState.attempt + 1,
        };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
        return {
            ok: false,
            message: "CPF ou senha incorretos.",
            attempt: prevState.attempt + 1,
        };
    }

    // TODO: set cookie/session aqui (ex: cookies().set(...))

    redirect("/dashboard");
}
