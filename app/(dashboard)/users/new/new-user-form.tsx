"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CpfInput } from "@/components/app/inputs/cpf-input";
import { PasswordInput } from "@/components/app/inputs/password-input";
import { createUserAction, type CreateUserState } from "../actions";
import { redirect } from "next/navigation";

const initialState: CreateUserState = { ok: true, attempt: 0 };

export function NewUserForm() {
    const [state, formAction, pending] = useActionState(createUserAction, initialState);
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    useEffect(() => {
        if (!state.attempt) return;

        if (state.ok) {
            if (state.message) toast.success(state.message);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName("");
            setCpf("");
            setPassword("");
            setPasswordConfirm("");
            redirect("/users");
        }

        if (state.message) toast.error(state.message);
    }, [state.attempt, state.ok, state.message]);


    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <form action={formAction} className="space-y-4">
            <FieldGroup className="grid gap-4 grid-cols-4 border-2 rounded-md p-4">
                <Field>
                    <FieldLabel htmlFor="name">Nome</FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Nome do usuário"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {err("name") && <p className="text-sm text-destructive">{err("name")}</p>}
                </Field>

                <Field>
                    <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                    <CpfInput
                        id="cpf"
                        name="cpf"
                        placeholder="000.000.000-00"
                        required
                        value={cpf}
                        onChange={(digits) => setCpf(digits)}
                    />

                    {err("cpf") && <p className="text-sm text-destructive">{err("cpf")}</p>}
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <PasswordInput
                        id="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {err("password") && <p className="text-sm text-destructive">{err("password")}</p>}
                </Field>

                <Field>
                    <FieldLabel htmlFor="passwordConfirm">Confirmar senha</FieldLabel>
                    <PasswordInput
                        id="passwordConfirm"
                        name="passwordConfirm"
                        required
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                    />

                    {err("passwordConfirm") && (
                        <p className="text-sm text-destructive">{err("passwordConfirm")}</p>
                    )}
                </Field>

                <Button type="submit" disabled={pending}>
                    {pending ? "Salvando..." : "Cadastrar usuário"}
                </Button>
            </FieldGroup>
        </form>
    );
}
