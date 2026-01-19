"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldGroup,
    FieldLabel
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CpfInput } from "../inputs/cpf-input";
import { PasswordInput } from "../inputs/password-input";
import { loginAction, type LoginState } from "@/app/(auth)/actions";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

const initialState: LoginState = { ok: true, attempt: 0 };

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const [state, formAction, pending] = useActionState(loginAction, initialState);

    useEffect(() => {
        if (!state.ok && state.message) {
            toast.error(state.message, { id: `login-error-${state.attempt}` });
        }
    }, [state.attempt, state.ok, state.message]);

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" action={formAction}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Bem-Vindo de Volta!</h1>

                                <p className="text-muted-foreground text-balance">
                                    Faça o login para entrar na sua conta.
                                </p>
                            </div>

                            <Field>
                                <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                                <CpfInput id="cpf" name="cpf" required placeholder="000.000.000-00" />
                            </Field>

                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                                </div>
                                <PasswordInput id="password" name="password" required />
                            </Field>

                            <Field>
                                <Button type="submit" disabled={pending}>
                                    {pending ? "Entrando..." : "Login"}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>

                    <div className="bg-muted relative hidden md:block">
                        <Image
                            src="/login-image-v3.jpg"
                            alt="Imagem da tela de login"
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover object-center dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
