"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoneyBrlInput } from "@/components/app/inputs/money-brl-input";
import { CreateProductState } from "@/types/products/product";
import { redirect } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createProductAction } from "../actions";

const initialState: CreateProductState = { ok: true, attempt: 0 };

export function NewProductForm() {
    const [state, formAction, pending] = useActionState(createProductAction, initialState);

    const [name, setName] = useState<string>("");
    const [model, setModel] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    useEffect(() => {
        if (!state.attempt) return;

        if (state.ok) {
            if (state.message) toast.success(state.message);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName("");
            setModel("");
            setNotes("");
            redirect("/products");
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
                        placeholder="Nome do produto"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    {err("name") && <p className="text-sm text-destructive">{err("name")}</p>}
                </Field>

                <Field className="col-span-2">
                    <FieldLabel htmlFor="purchasePrice">Valor de compra</FieldLabel>
                    <MoneyBrlInput
                        id="purchasePrice"
                        name="purchasePrice"
                        placeholder="R$ 0"
                        required
                    />
                    {err("purchasePrice") && <p className="text-sm text-destructive">{err("purchasePrice")}</p>}
                </Field>

                <Field className="col-span-2">
                    <FieldLabel htmlFor="salePrice">Valor de venda</FieldLabel>
                    <MoneyBrlInput
                        id="salePrice"
                        name="salePrice"
                        placeholder="R$ 0"
                        required
                    />
                    {err("salePrice") && <p className="text-sm text-destructive">{err("salePrice")}</p>}
                </Field>

                <Field className="col-span-4">
                    <FieldLabel htmlFor="model">Modelo</FieldLabel>
                    <Input
                        id="model"
                        name="model"
                        placeholder="Modelo do produto"
                        required
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                    {err("model") && <p className="text-sm text-destructive">{err("model")}</p>}
                </Field>

                <Field className="col-span-4">
                    <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Opcional"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    {err("notes") && <p className="text-sm text-destructive">{err("notes")}</p>}
                </Field>

                <Button type="submit" disabled={pending} className="col-span-4">
                    {pending ? "Salvando..." : "Cadastrar produto"}
                </Button>
            </FieldGroup>
        </form>
    );
}
