"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CpfInput } from "@/components/app/inputs/cpf-input";

import { updateUserAction, type UpdateUserState } from "../actions";
import { PasswordInput } from "@/components/app/inputs/password-input";

const initialState: UpdateUserState = { ok: true, attempt: 0 };

type UserDTO = { id: number; name: string; cpf: string };

export function EditUserForm({ user }: { user: UserDTO }) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(updateUserAction, initialState);

    const [name, setName] = useState(user.name);
    const [cpf, setCpf] = useState(user.cpf);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    useEffect(() => {
        if (!state.attempt) return;
        if (!state.ok) toast.error(state.message ?? "Não foi possível salvar.");
    }, [state.attempt, state.ok, state.message]);

    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={user.id} />

            <FieldGroup className="grid gap-4 grid-cols-4 border-2 rounded-md p-4">
                <Field className="">
                    <FieldLabel htmlFor="name">Código (ID)</FieldLabel>
                    <Input
                        id="id"
                        name="id"
                        required
                        value={user.id}
                        disabled
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="name">Nome</FieldLabel>
                    <Input
                        id="name"
                        name="name"
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
                        required
                        value={cpf}
                        onChange={(digits) => setCpf(digits)}
                        placeholder="000.000.000-00"
                    />
                    {err("cpf") && <p className="text-sm text-destructive">{err("cpf")}</p>}
                </Field>

                <Field className="col-span-2">
                    <div className="flex items-center justify-between gap-3">
                        <FieldLabel htmlFor="password">Nova senha</FieldLabel>
                        <span className="text-xs text-muted-foreground">
                            (Deixe em branco para manter a senha atual)
                        </span>
                    </div>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    // placeholder="••••••••"
                    />

                    {err("password") && <p className="text-sm text-destructive">{err("password")}</p>}
                </Field>

                <Field className="col-span-2">
                    <FieldLabel htmlFor="passwordConfirm">Confirmar nova senha</FieldLabel>
                    <PasswordInput
                        id="passwordConfirm"
                        name="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                    // placeholder="••••••••"
                    />

                    {err("passwordConfirm") && (
                        <p className="text-sm text-destructive">{err("passwordConfirm")}</p>
                    )}
                </Field>


                <div className="col-span-4 flex gap-2">
                    <Button type="submit" disabled={pending}>
                        {pending ? "Salvando..." : "Salvar alterações"}
                    </Button>

                    <Button type="button" variant="outline" onClick={() => router.push("/users")}>
                        Cancelar
                    </Button>
                </div>
            </FieldGroup>
        </form>
    );
}
