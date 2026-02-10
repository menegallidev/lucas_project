"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/app/inputs/phone-input";
import { CpfCnpjInput } from "@/components/app/inputs/cpf-cnpj-input";
import { CepInput } from "@/components/app/inputs/cep-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { updateClientAction } from "../actions";
import type { UpdateClientState } from "@/types/clients/client";
import type { ClientStatus, TipoPessoa } from "@prisma/client";

const initialState: UpdateClientState = { ok: true, attempt: 0 };

type ClientDTO = {
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

export function EditClientForm({
    client,
    companies,
}: {
    client: ClientDTO;
    companies: Array<{ id: number; name: string }>;
}) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(updateClientAction, initialState);

    const [personType, setPersonType] = useState<string>(client.personType ?? "PF");
    const [name, setName] = useState<string>(client.name ?? "");
    const [tradeName, setTradeName] = useState<string>(client.tradeName ?? "");
    const [document, setDocument] = useState<string>(client.document ?? "");
    const [stateTaxId, setStateTaxId] = useState<string>(client.stateTaxId ?? "");
    const [companyId, setCompanyId] = useState<string>(client.companyId ? String(client.companyId) : "");

    const [email, setEmail] = useState<string>(client.email ?? "");
    const [phone1, setPhone1] = useState<string>(client.phone1 ?? "");
    const [phone2, setPhone2] = useState<string>(client.phone2 ?? "");
    const [whatsapp, setWhatsapp] = useState<string>(client.whatsapp ?? "");

    const [zipCode, setZipCode] = useState<string>(client.zipCode ?? "");
    const [street, setStreet] = useState<string>(client.street ?? "");
    const [number, setNumber] = useState<string>(client.number ?? "");
    const [complement, setComplement] = useState<string>(client.complement ?? "");
    const [neighborhood, setNeighborhood] = useState<string>(client.neighborhood ?? "");
    const [city, setCity] = useState<string>(client.city ?? "");
    const [stateUf, setStateUf] = useState<string>(client.state ?? "");
    const [referencePoint, setReferencePoint] = useState<string>(client.referencePoint ?? "");
    const [isLoadingCep, setIsLoadingCep] = useState<boolean>(false);

    const [paymentTerms, setPaymentTerms] = useState<string>(client.paymentTerms ?? "");
    const [notes, setNotes] = useState<string>(client.notes ?? "");
    const [status, setStatus] = useState<string>(client.status ?? "ATIVO");

    const hasCompanies = companies.length > 0;

    useEffect(() => {
        const cep = zipCode.replace(/\D/g, "");
        if (cep.length !== 8) return;

        const controller = new AbortController();

        (async () => {
            setIsLoadingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
                    signal: controller.signal,
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data?.erro) return;

                setStreet(data?.logradouro ?? "");
                setNeighborhood(data?.bairro ?? "");
                setCity(data?.localidade ?? "");
                setStateUf(data?.uf ?? "");
                if (data?.complemento) setComplement(data.complemento);
            } catch {
                // ignore lookup errors
            } finally {
                setIsLoadingCep(false);
            }
        })();

        return () => controller.abort();
    }, [zipCode]);

    useEffect(() => {
        if (!state.attempt) return;
        if (!state.ok) toast.error(state.message ?? "Nao foi possivel salvar.");
    }, [state.attempt, state.ok, state.message]);

    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={client.id} />

            <FieldGroup className="border-2 rounded-md p-4 space-y-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">Principal</h3>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 grid-cols-4">
                    <Field className="col-span-1">
                        <FieldLabel htmlFor="id">Codigo (ID)</FieldLabel>
                        <Input id="id" name="id" value={client.id} disabled />
                    </Field>

                    <Field className="col-span-3">
                        <FieldLabel htmlFor="companyId">Empresa</FieldLabel>
                        <Select
                            value={companyId}
                            onValueChange={(value) => setCompanyId(value)}
                            disabled={!hasCompanies}
                        >
                            <SelectTrigger id="companyId">
                                <SelectValue
                                    placeholder={hasCompanies ? "Selecione uma empresa" : "Nenhuma empresa cadastrada"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((company) => (
                                    <SelectItem key={company.id} value={String(company.id)}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="companyId" value={companyId} />
                        {err("companyId") && <p className="text-sm text-destructive">{err("companyId")}</p>}
                    </Field>

                    <Field className="col-span-1">
                        <FieldLabel>Tipo</FieldLabel>

                        <div className="flex items-center gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="personType"
                                    value="PF"
                                    checked={personType === "PF"}
                                    onChange={(e) => setPersonType(e.target.value)}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">PF</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="personType"
                                    value="PJ"
                                    checked={personType === "PJ"}
                                    onChange={(e) => setPersonType(e.target.value)}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">PJ</span>
                            </label>
                        </div>

                        {err("personType") && <p className="text-sm text-destructive">{err("personType")}</p>}
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

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="name">Nome</FieldLabel>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Nome do cliente ou empresa"
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

                    <Field>
                        <FieldLabel htmlFor="document">Documento (CPF/CNPJ)</FieldLabel>
                        <CpfCnpjInput
                            id="document"
                            name="document"
                            placeholder="Opcional"
                            value={document}
                            onChange={(digits) => setDocument(digits)}
                        />
                        {err("document") && <p className="text-sm text-destructive">{err("document")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="stateTaxId">Inscricao estadual</FieldLabel>
                        <Input
                            id="stateTaxId"
                            name="stateTaxId"
                            placeholder="Opcional"
                            value={stateTaxId}
                            onChange={(e) => setStateTaxId(e.target.value)}
                        />
                        {err("stateTaxId") && <p className="text-sm text-destructive">{err("stateTaxId")}</p>}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="paymentTerms">Condicao de pagamento</FieldLabel>
                        <Input
                            id="paymentTerms"
                            name="paymentTerms"
                            placeholder="Ex.: A vista, 30 dias..."
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                        />
                        {err("paymentTerms") && (
                            <p className="text-sm text-destructive">{err("paymentTerms")}</p>
                        )}
                    </Field>
                </div>

                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">Contato</h3>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 grid-cols-4">
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

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="phone1">Telefone</FieldLabel>
                        <PhoneInput
                            id="phone1"
                            name="phone1"
                            placeholder="(DDD) 99999-9999"
                            required
                            value={phone1}
                            onChange={(digits) => setPhone1(digits)}
                        />
                        {err("phone1") && <p className="text-sm text-destructive">{err("phone1")}</p>}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
                        <PhoneInput
                            id="whatsapp"
                            name="whatsapp"
                            placeholder="Opcional"
                            value={whatsapp}
                            onChange={(digits) => setWhatsapp(digits)}
                        />
                        {err("whatsapp") && <p className="text-sm text-destructive">{err("whatsapp")}</p>}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="phone2">Telefone 2</FieldLabel>
                        <PhoneInput
                            id="phone2"
                            name="phone2"
                            placeholder="Opcional"
                            value={phone2}
                            onChange={(digits) => setPhone2(digits)}
                        />
                        {err("phone2") && <p className="text-sm text-destructive">{err("phone2")}</p>}
                    </Field>
                </div>

                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">Endereco</h3>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 grid-cols-4">
                    <Field>
                        <FieldLabel htmlFor="zipCode">CEP</FieldLabel>
                        <CepInput
                            id="zipCode"
                            name="zipCode"
                            placeholder="00000-000"
                            value={zipCode}
                            onChange={(digits) => setZipCode(digits)}
                        />
                        {err("zipCode") && <p className="text-sm text-destructive">{err("zipCode")}</p>}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="street">Logradouro</FieldLabel>
                        <Input
                            id="street"
                            name="street"
                            placeholder="Rua/Avenida..."
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            disabled={isLoadingCep}
                        />
                        {err("street") && <p className="text-sm text-destructive">{err("street")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="number">Numero</FieldLabel>
                        <Input
                            id="number"
                            name="number"
                            placeholder="N"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            disabled={isLoadingCep}
                        />
                        {err("number") && <p className="text-sm text-destructive">{err("number")}</p>}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="neighborhood">Bairro</FieldLabel>
                        <Input
                            id="neighborhood"
                            name="neighborhood"
                            placeholder="Bairro"
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            disabled={isLoadingCep}
                        />
                        {err("neighborhood") && (
                            <p className="text-sm text-destructive">{err("neighborhood")}</p>
                        )}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="city">Cidade</FieldLabel>
                        <Input
                            id="city"
                            name="city"
                            placeholder="Cidade"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            disabled={isLoadingCep}
                        />
                        {err("city") && <p className="text-sm text-destructive">{err("city")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="state">UF</FieldLabel>
                        <Input
                            id="state"
                            name="state"
                            placeholder="SP"
                            value={stateUf}
                            onChange={(e) => setStateUf(e.target.value)}
                            disabled={isLoadingCep}
                        />
                        {err("state") && <p className="text-sm text-destructive">{err("state")}</p>}
                    </Field>

                    <Field className="col-span-3">
                        <FieldLabel htmlFor="complement">Complemento</FieldLabel>
                        <Input
                            id="complement"
                            name="complement"
                            placeholder="Apto, bloco..."
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                            disabled={isLoadingCep}
                        />
                        {err("complement") && <p className="text-sm text-destructive">{err("complement")}</p>}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="referencePoint">Ponto de referencia</FieldLabel>
                        <Input
                            id="referencePoint"
                            name="referencePoint"
                            placeholder="Opcional"
                            value={referencePoint}
                            onChange={(e) => setReferencePoint(e.target.value)}
                            disabled={isLoadingCep}
                        />
                        {err("referencePoint") && (
                            <p className="text-sm text-destructive">{err("referencePoint")}</p>
                        )}
                    </Field>
                </div>

                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">Observacoes</h3>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 grid-cols-4">
                    <Field className="col-span-4">
                        <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Ex.: ligar antes, horario para atendimento, acesso ao local, detalhes importantes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                        />
                        {err("notes") && <p className="text-sm text-destructive">{err("notes")}</p>}
                    </Field>

                    <div className="col-span-4 flex gap-2">
                        <Button type="submit" disabled={pending}>
                            {pending ? "Salvando..." : "Salvar alterações"}
                        </Button>

                        <Button type="button" variant="outline" onClick={() => router.push("/clients")}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </FieldGroup>
        </form>
    );
}
