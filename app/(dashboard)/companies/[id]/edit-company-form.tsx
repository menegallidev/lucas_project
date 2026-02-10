"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/app/inputs/phone-input";
import { CpfCnpjInput } from "@/components/app/inputs/cpf-cnpj-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { updateCompanyAction } from "../actions";
import type { UpdateCompanyState } from "@/types/companies/company";
import type { ClientStatus } from "@prisma/client";

const initialState: UpdateCompanyState = { ok: true, attempt: 0 };

type CompanyDTO = {
    id: number;
    name: string;
    tradeName: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    status: ClientStatus;
};

export function EditCompanyForm({ company }: { company: CompanyDTO }) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(updateCompanyAction, initialState);

    const [name, setName] = useState<string>(company.name ?? "");
    const [tradeName, setTradeName] = useState<string>(company.tradeName ?? "");
    const [document, setDocument] = useState<string>(company.document ?? "");
    const [email, setEmail] = useState<string>(company.email ?? "");
    const [phone, setPhone] = useState<string>(company.phone ?? "");
    const [status, setStatus] = useState<string>(company.status ?? "ATIVO");

    useEffect(() => {
        if (!state.attempt) return;
        if (!state.ok) toast.error(state.message ?? "Nao foi possivel salvar.");
    }, [state.attempt, state.ok, state.message]);

    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={company.id} />

            <FieldGroup className="grid gap-4 grid-cols-4 border-2 rounded-md p-4">
                <Field className="col-span-1">
                    <FieldLabel htmlFor="id">Codigo (ID)</FieldLabel>
                    <Input
                        id="id"
                        name="id"
                        value={company.id}
                        disabled
                    />
                </Field>

                <Field className="col-span-3">
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

                <Field className="col-span-2">
                    <FieldLabel htmlFor="tradeName">Nome fantasia</FieldLabel>
                    <Input
                        id="tradeName"
                        name="tradeName"
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
                        value={phone}
                        onChange={(digits) => setPhone(digits)}
                    />
                    {err("phone") && <p className="text-sm text-destructive">{err("phone")}</p>}
                </Field>

                <Field className="col-span-1">
                    <FieldLabel htmlFor="status">Status</FieldLabel>
                    <Select value={status} onValueChange={(value) => setStatus(value)}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ATIVO">Ativo</SelectItem>
                            <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="status" value={status} />
                    {err("status") && <p className="text-sm text-destructive">{err("status")}</p>}
                </Field>

                <div className="col-span-4 flex gap-2">
                    <Button type="submit" disabled={pending}>
                        {pending ? "Salvando..." : "Salvar alterações"}
                    </Button>

                    <Button type="button" variant="outline" onClick={() => router.push("/companies")}>
                        Cancelar
                    </Button>
                </div>
            </FieldGroup>
        </form>
    );
}
