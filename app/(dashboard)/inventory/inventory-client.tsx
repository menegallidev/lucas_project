"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatInAppTimeZone, toDateKeyInAppTimeZone, toDateTimeLocalInAppTimeZone } from "@/lib/date-time";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createInventoryMovementAction } from "./actions";
import type { CreateInventoryMovementState, InventoryMovementRow, InventoryProductOption } from "@/types/inventory/movement";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const initialState: CreateInventoryMovementState = { ok: true, attempt: 0 };

function nowLocalDateTime() {
    return toDateTimeLocalInAppTimeZone(new Date());
}

export default function InventoryClient({
    products,
    initialMovements,
}: {
    products: InventoryProductOption[];
    initialMovements: InventoryMovementRow[];
}) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(createInventoryMovementAction, initialState);

    const [movementType, setMovementType] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
    const [productId, setProductId] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("1");
    const [performedAt, setPerformedAt] = useState<string>(nowLocalDateTime());
    const [notes, setNotes] = useState<string>("");

    const todayDateKey = toDateKeyInAppTimeZone(new Date());
    const entradasHoje = useMemo(
        () =>
            initialMovements.filter(
                (item) => item.movementType === "ENTRADA" && toDateKeyInAppTimeZone(item.performedAt) === todayDateKey
            ).length,
        [initialMovements, todayDateKey]
    );
    const saidasHoje = useMemo(
        () =>
            initialMovements.filter(
                (item) => item.movementType === "SAIDA" && toDateKeyInAppTimeZone(item.performedAt) === todayDateKey
            ).length,
        [initialMovements, todayDateKey]
    );

    useEffect(() => {
        if (!state.attempt) return;

        if (state.ok) {
            if (state.message) toast.success(state.message);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMovementType("ENTRADA");
            setProductId("");
            setQuantity("1");
            setPerformedAt(nowLocalDateTime());
            setNotes("");
            router.refresh();
            return;
        }

        if (state.message) toast.error(state.message);
    }, [state.attempt, state.ok, state.message, router]);

    const err = (key: string) => state.fieldErrors?.[key]?.[0];

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Produtos Ativos</CardTitle>
                        <Package className="size-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{products.length}</p>
                        <p className="text-sm text-muted-foreground">Produtos disponiveis para movimentacao</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Entradas Hoje</CardTitle>
                        <TrendingUp className="size-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{entradasHoje}</p>
                        <p className="text-sm text-muted-foreground">Movimentacoes de entrada registradas hoje</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Saidas Hoje</CardTitle>
                        <Boxes className="size-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{saidasHoje}</p>
                        <p className="text-sm text-muted-foreground">Movimentacoes de saida registradas hoje</p>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Lançar Movimentação</CardTitle>
                        <CardDescription>Registrar entrada ou saida de um produto</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-4">
                            <FieldGroup className="space-y-4">
                                <Field>
                                    <FieldLabel htmlFor="movementType">Tipo</FieldLabel>
                                    <Select value={movementType} onValueChange={(value) => setMovementType(value as "ENTRADA" | "SAIDA")}>
                                        <SelectTrigger id="movementType" className="w-full">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ENTRADA">Entrada</SelectItem>
                                            <SelectItem value="SAIDA">Saida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="movementType" value={movementType} />
                                    {err("movementType") && <p className="text-sm text-destructive">{err("movementType")}</p>}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="productId">Produto</FieldLabel>
                                    <Select value={productId} onValueChange={setProductId}>
                                        <SelectTrigger id="productId" className="w-full">
                                            <SelectValue placeholder="Selecione um produto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={String(product.id)}>
                                                    {product.label} - estoque: {product.stockQuantity}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="productId" value={productId} />
                                    {err("productId") && <p className="text-sm text-destructive">{err("productId")}</p>}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="quantity">Quantidade</FieldLabel>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
                                    />

                                    {err("quantity") && <p className="text-sm text-destructive">{err("quantity")}</p>}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="performedAt">Data e Hora</FieldLabel>
                                    <Input
                                        id="performedAt"
                                        name="performedAt"
                                        type="datetime-local"
                                        value={performedAt}
                                        onChange={(e) => setPerformedAt(e.target.value)}
                                    />
                                    {err("performedAt") && <p className="text-sm text-destructive">{err("performedAt")}</p>}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="notes">Observacao</FieldLabel>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        placeholder="Opcional"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                    {err("notes") && <p className="text-sm text-destructive">{err("notes")}</p>}
                                </Field>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={pending}>
                                        {pending ? "Lancando..." : "Lancar"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setMovementType("ENTRADA");
                                            setProductId("");
                                            setQuantity("1");
                                            setPerformedAt(nowLocalDateTime());
                                            setNotes("");
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                </div>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Movimentacoes</CardTitle>
                            <CardDescription>Historico mais recente de entradas e saidas</CardDescription>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/products" className="inline-flex items-center gap-2">
                                Ver Produtos
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Quantidade</TableHead>
                                    <TableHead>Observacao</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialMovements.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell>
                                            {formatInAppTimeZone(movement.performedAt, {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <span className={movement.movementType === "ENTRADA" ? "text-emerald-600" : "text-red-600"}>
                                                {movement.movementType}
                                            </span>
                                        </TableCell>
                                        <TableCell>{movement.productName} ({movement.productModel})</TableCell>
                                        <TableCell>{movement.quantity}</TableCell>
                                        <TableCell>{movement.notes || "-"}</TableCell>
                                    </TableRow>
                                ))}

                                {initialMovements.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            Nenhuma movimentacao registrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
