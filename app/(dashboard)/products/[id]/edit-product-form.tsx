"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoneyBrlInput } from "@/components/app/inputs/money-brl-input";
import { UpdateProductState } from "@/types/products/product";
import type { ClientStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateProductAction } from "../actions";

const initialState: UpdateProductState = { ok: true, attempt: 0 };

type ProductDTO = {
    id: number;
    name: string;
    purchasePrice: number;
    salePrice: number;
    model: string;
    notes: string | null;
    status: ClientStatus;
    stockQuantity: number;
};

export function EditProductForm({ product }: { product: ProductDTO }) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(updateProductAction, initialState);

    const [name, setName] = useState<string>(product.name);
    const [model, setModel] = useState<string>(product.model);
    const [notes, setNotes] = useState<string>(product.notes ?? "");
    const [status, setStatus] = useState<string>(product.status ?? "ATIVO");

    useEffect(() => {
        if (!state.attempt) return;
        if (state.ok) {
            if (state.message) toast.success(state.message);
            router.push("/products");
            return;
        }
        if (!state.ok) toast.error(state.message ?? "Nao foi possivel salvar.");
    }, [state.attempt, state.ok, state.message, router]);

    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={product.id} />

            <FieldGroup className="grid gap-4 grid-cols-12 border-2 rounded-md p-4">
                <Field className="col-span-12 md:col-span-2">
                    <FieldLabel htmlFor="id">Codigo (ID)</FieldLabel>
                    <Input
                        id="id"
                        name="id"
                        value={product.id}
                        disabled
                    />
                </Field>

                <Field className="col-span-12 md:col-span-10">
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

                <Field className="col-span-12 md:col-span-3">
                    <FieldLabel htmlFor="purchasePrice">Valor de compra</FieldLabel>
                    <MoneyBrlInput
                        id="purchasePrice"
                        name="purchasePrice"
                        required
                        defaultValue={String(product.purchasePrice)}
                    />
                    {err("purchasePrice") && <p className="text-sm text-destructive">{err("purchasePrice")}</p>}
                </Field>

                <Field className="col-span-12 md:col-span-3">
                    <FieldLabel htmlFor="salePrice">Valor de venda</FieldLabel>
                    <MoneyBrlInput
                        id="salePrice"
                        name="salePrice"
                        required
                        defaultValue={String(product.salePrice)}
                    />
                    {err("salePrice") && <p className="text-sm text-destructive">{err("salePrice")}</p>}
                </Field>

                <Field className="col-span-12 md:col-span-3">
                    <FieldLabel htmlFor="model">Modelo</FieldLabel>
                    <Input
                        id="model"
                        name="model"
                        required
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                    {err("model") && <p className="text-sm text-destructive">{err("model")}</p>}
                </Field>

                <Field className="col-span-12 md:col-span-3">
                    <FieldLabel htmlFor="stockQuantity">Quantidade em estoque</FieldLabel>
                    <Input
                        id="stockQuantity"
                        value={String(product.stockQuantity)}
                        disabled
                    />
                </Field>

                <Field className="col-span-12 md:col-span-4">
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

                <Field className="col-span-12 md:col-span-8">
                    <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                    <Textarea
                        id="notes"
                        name="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    {err("notes") && <p className="text-sm text-destructive">{err("notes")}</p>}
                </Field>

                <div className="col-span-12 flex gap-2">
                    <Button type="submit" disabled={pending}>
                        {pending ? "Salvando..." : "Salvar alteracoes"}
                    </Button>

                    <Button type="button" variant="outline" onClick={() => router.push("/products")}>
                        Cancelar
                    </Button>
                </div>
            </FieldGroup>
        </form>
    );
}
