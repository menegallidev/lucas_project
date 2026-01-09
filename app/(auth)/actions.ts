"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData): Promise<void> {
    console.log(formData);

    const cpf = String(formData.get("cpf") ?? "").replace(/\D/g, "");
    const password = String(formData.get("password") ?? "");

    if (!cpf || !password) {
        throw new Error("CPF e senha são obrigatórios.");
    }

    const user = await prisma.user.findFirst({
        where: { cpf },
        select: { id: true, password: true },
    });

    if (!user) throw new Error("CPF ou senha incorretos.");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error("CPF ou senha incorretos.");

    // set cookie/session aqui...

    redirect("/dashboard");
}
