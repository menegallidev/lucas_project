"use client";

import { CreateClientState } from "@/types/clients/client";
import { useActionState, useEffect, useState } from "react";
import { createClientAction } from "../actions";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: CreateClientState = { ok: true, attempt: 0 };

export function NewClientForm() {
    const [state, formAction, pending] = useActionState(createClientAction, initialState);

    const [personType, setPersonType] = useState<string>("PF");
    const [name, setName] = useState<string>("");
    const [tradeName, setTradeName] = useState<string>("");
    const [document, setDocument] = useState<string>("");
    const [stateTaxId, setStateTaxId] = useState<string>("");
    const [birthDate, setBirthDate] = useState<string>("");

    const [email, setEmail] = useState<string>("");
    const [phone1, setPhone1] = useState<string>("");
    const [phone2, setPhone2] = useState<string>("");
    const [whatsapp, setWhatsapp] = useState<string>("");

    const [zipCode, setZipCode] = useState<string>("");
    const [street, setStreet] = useState<string>("");
    const [number, setNumber] = useState<string>("");
    const [complement, setComplement] = useState<string>("");
    const [neighborhood, setNeighborhood] = useState<string>("");
    const [city, setCity] = useState<string>("");
    const [stateUf, setStateUf] = useState<string>("");
    const [referencePoint, setReferencePoint] = useState<string>("");

    const [paymentTerms, setPaymentTerms] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    useEffect(() => {
        if (!state.attempt) return;

        if (state.ok) {
            if (state.message) toast.success(state.message);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPersonType("PF");
            setName("");
            setTradeName("");
            setDocument("");
            setStateTaxId("");
            setBirthDate("");

            setEmail("");
            setPhone1("");
            setPhone2("");
            setWhatsapp("");

            setZipCode("");
            setStreet("");
            setNumber("");
            setComplement("");
            setNeighborhood("");
            setCity("");
            setStateUf("");
            setReferencePoint("");

            setPaymentTerms("");
            setNotes("");
            return;
        }

        if (state.message) toast.error(state.message);
    }, [state.attempt, state.ok, state.message]);

    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <form action={formAction} className="space-y-4">
            <FieldGroup className="border-2 rounded-md p-4 space-y-6">
                {/* PRINCIPAL */}
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">Principal</h3>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 grid-cols-4">
                    <Field className="col-span-4">
                        <FieldLabel>Tipo</FieldLabel>

                        {/* Radio PF/PJ */}
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
                        <Input
                            id="document"
                            name="document"
                            placeholder="Opcional"
                            value={document}
                            onChange={(e) => setDocument(e.target.value)}
                        />
                        {err("document") && <p className="text-sm text-destructive">{err("document")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="stateTaxId">Inscrição estadual</FieldLabel>
                        <Input
                            id="stateTaxId"
                            name="stateTaxId"
                            placeholder="Opcional"
                            value={stateTaxId}
                            onChange={(e) => setStateTaxId(e.target.value)}
                        />
                        {err("stateTaxId") && <p className="text-sm text-destructive">{err("stateTaxId")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="birthDate">Data de nascimento</FieldLabel>
                        <Input
                            id="birthDate"
                            name="birthDate"
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                        />
                        {err("birthDate") && <p className="text-sm text-destructive">{err("birthDate")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="paymentTerms">Condição de pagamento</FieldLabel>
                        <Input
                            id="paymentTerms"
                            name="paymentTerms"
                            placeholder="Ex.: À vista, 30 dias..."
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                        />
                        {err("paymentTerms") && (
                            <p className="text-sm text-destructive">{err("paymentTerms")}</p>
                        )}
                    </Field>
                </div>

                {/* CONTATO */}
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

                    <Field>
                        <FieldLabel htmlFor="phone1">Telefone</FieldLabel>
                        <Input
                            id="phone1"
                            name="phone1"
                            placeholder="(DDD) 99999-9999"
                            required
                            value={phone1}
                            onChange={(e) => setPhone1(e.target.value)}
                        />
                        {err("phone1") && <p className="text-sm text-destructive">{err("phone1")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
                        <Input
                            id="whatsapp"
                            name="whatsapp"
                            placeholder="Opcional"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                        />
                        {err("whatsapp") && <p className="text-sm text-destructive">{err("whatsapp")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="phone2">Telefone 2</FieldLabel>
                        <Input
                            id="phone2"
                            name="phone2"
                            placeholder="Opcional"
                            value={phone2}
                            onChange={(e) => setPhone2(e.target.value)}
                        />
                        {err("phone2") && <p className="text-sm text-destructive">{err("phone2")}</p>}
                    </Field>
                </div>

                {/* ENDEREÇO */}
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">Endereço</h3>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 grid-cols-4">
                    <Field>
                        <FieldLabel htmlFor="zipCode">CEP</FieldLabel>
                        <Input
                            id="zipCode"
                            name="zipCode"
                            placeholder="00000-000"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
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
                        />
                        {err("street") && <p className="text-sm text-destructive">{err("street")}</p>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="number">Número</FieldLabel>
                        <Input
                            id="number"
                            name="number"
                            placeholder="Nº"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
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
                        />
                        {err("complement") && <p className="text-sm text-destructive">{err("complement")}</p>}
                    </Field>

                    <Field className="col-span-2">
                        <FieldLabel htmlFor="referencePoint">Ponto de referência</FieldLabel>
                        <Input
                            id="referencePoint"
                            name="referencePoint"
                            placeholder="Opcional"
                            value={referencePoint}
                            onChange={(e) => setReferencePoint(e.target.value)}
                        />
                        {err("referencePoint") && (
                            <p className="text-sm text-destructive">{err("referencePoint")}</p>
                        )}
                    </Field>
                </div>

                {/* OBSERVAÇÕES */}
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold">Observações</h3>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 grid-cols-4">
                    <Field className="col-span-4">
                        <FieldLabel htmlFor="notes">Observações</FieldLabel>
                        <textarea
                            id="notes"
                            name="notes"
                            placeholder="Ex.: ligar antes, horário para atendimento, acesso ao local, detalhes importantes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {err("notes") && <p className="text-sm text-destructive">{err("notes")}</p>}
                    </Field>

                    <Button type="submit" disabled={pending} className="col-span-4">
                        {pending ? "Salvando..." : "Cadastrar cliente"}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    );
}
