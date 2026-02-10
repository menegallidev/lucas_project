"use client";

import { CreateCompanyState } from "@/types/companies/company";
import { useActionState, useEffect, useState } from "react";
import { createCompanyAction } from "../actions";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/app/inputs/phone-input";
import { CpfCnpjInput } from "@/components/app/inputs/cpf-cnpj-input";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

const initialState: CreateCompanyState = { ok: true, attempt: 0 };

export function NewCompanyForm() {
    const [state, formAction, pending] = useActionState(createCompanyAction, initialState);

    const [name, setName] = useState<string>("");
    const [tradeName, setTradeName] = useState<string>("");
    const [document, setDocument] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");

    useEffect(() => {
        if (!state.attempt) return;

        if (state.ok) {
            if (state.message) toast.success(state.message);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName("");
            setTradeName("");
            setDocument("");
            setEmail("");
            setPhone("");
            redirect("/companies");
            return;
        }

        if (state.message) toast.error(state.message);
    }, [state.attempt, state.ok, state.message]);

    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <form action={formAction} className="space-y-4">
            <FieldGroup className="grid gap-4 grid-cols-4 border-2 rounded-md p-4">
                <Field className="col-span-4">
                    <FieldLabel htmlFor="name">Nome</FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Nome da empresa"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    {err("name") && <p className="text-sm text-destructive">{err("name")}</p>}
                </Field>

                <Field className="col-span-2">
                    <FieldLabel htmlFor="tradeName">Nome fantasia</FieldLabel>
                    <Input
                        id="tradeName"
                        name="tradeName"
                        placeholder="Opcional"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                    />
                    {err("tradeName") && <p className="text-sm text-destructive">{err("tradeName")}</p>}
                </Field>

                <Field className="col-span-2">
                    <FieldLabel htmlFor="document">Documento (CNPJ)</FieldLabel>
                    <CpfCnpjInput
                        id="document"
                        name="document"
                        placeholder="Opcional"
                        value={document}
                        onChange={(digits) => setDocument(digits)}
                    />
                    {err("document") && <p className="text-sm text-destructive">{err("document")}</p>}
                </Field>

                <Field className="col-span-2">
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Opcional"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
                </Field>

                <Field className="col-span-1">
                    <FieldLabel htmlFor="phone">Telefone</FieldLabel>
                    <PhoneInput
                        id="phone"
                        name="phone"
                        placeholder="(DDD) 99999-9999"
                        value={phone}
                        onChange={(digits) => setPhone(digits)}
                    />
                    {err("phone") && <p className="text-sm text-destructive">{err("phone")}</p>}
                </Field>

                <div className="col-span-1" aria-hidden="true" />

                <Button type="submit" disabled={pending} className="col-span-4">
                    {pending ? "Salvando..." : "Cadastrar empresa"}
                </Button>
            </FieldGroup>
        </form>
    );
}
