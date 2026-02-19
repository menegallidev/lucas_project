"use client";

import { createQuoteAction, markQuoteAsSoldAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatInAppTimeZone } from "@/lib/date-time";
import type {
    CreateQuotePayload,
    QuoteClientOption,
    QuoteDiscountType,
    QuoteLineForm,
    QuoteListRow,
    QuoteListStatusFilter,
    QuoteProductOption,
} from "@/types/quotes/quote";
import { Calculator, CheckCircle2, FileText, ImageIcon, Package, Plus, Search, ShoppingCart, Trash2, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parsePositiveNumber(value: string): number {
    const parsed = Number.parseFloat(value.trim().replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
}

function getDiscountAmount(baseValue: number, discountType: QuoteDiscountType, discountInputValue: number): number {
    if (baseValue <= 0 || discountInputValue <= 0) return 0;
    if (discountType === "percent") return baseValue * (Math.min(discountInputValue, 100) / 100);
    return Math.min(discountInputValue, baseValue);
}

function getVisiblePages(currentPage: number, totalPages: number) {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) pages.push(page);
    return pages;
}

function statusLabel(status: "PENDENTE" | "VENDIDO") {
    return status === "VENDIDO" ? "VENDIDO" : "PENDENTE";
}

function statusClass(status: "PENDENTE" | "VENDIDO") {
    return status === "VENDIDO" ? "text-emerald-600" : "text-amber-600";
}

export default function QuotesSalesClient({
    clients,
    products,
    quotes,
    pagination,
    filters,
}: {
    clients: QuoteClientOption[];
    products: QuoteProductOption[];
    quotes: QuoteListRow[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
    filters: { search: string; status: QuoteListStatusFilter };
}) {
    const router = useRouter();
    const pathname = usePathname();
    const lineCounterRef = useRef(2);

    const [selectedClientId, setSelectedClientId] = useState("");
    const [quoteTitle, setQuoteTitle] = useState("");
    const [generalDiscountType, setGeneralDiscountType] = useState<QuoteDiscountType>("amount");
    const [generalDiscountValue, setGeneralDiscountValue] = useState("");
    const [notes, setNotes] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [lastCreatedQuoteId, setLastCreatedQuoteId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState<QuoteListStatusFilter>(filters.status);
    const [sellingQuoteId, setSellingQuoteId] = useState<number | null>(null);
    const [lines, setLines] = useState<QuoteLineForm[]>([
        { lineId: "line-1", productId: "", quantity: "1", discountType: "amount", discountValue: "" },
    ]);

    const [creating, startCreating] = useTransition();
    const [selling, startSelling] = useTransition();

    const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

    const rows = useMemo(
        () =>
            lines.map((line) => {
                const product = productsById.get(Number(line.productId));
                const quantity = parsePositiveNumber(line.quantity);
                const totalPurchase = (product?.purchasePrice ?? 0) * quantity;
                const totalSaleGross = (product?.salePrice ?? 0) * quantity;
                const itemDiscountAmount = getDiscountAmount(totalSaleGross, line.discountType, parsePositiveNumber(line.discountValue));
                const totalSaleNet = Math.max(0, totalSaleGross - itemDiscountAmount);

                return { line, product, quantity, totalPurchase, totalSaleGross, itemDiscountAmount, totalSaleNet };
            }),
        [lines, productsById]
    );

    const totals = useMemo(() => {
        const purchaseTotal = rows.reduce((acc, row) => acc + row.totalPurchase, 0);
        const saleGrossTotal = rows.reduce((acc, row) => acc + row.totalSaleGross, 0);
        const itemDiscountTotal = rows.reduce((acc, row) => acc + row.itemDiscountAmount, 0);
        const saleAfterItemDiscount = Math.max(0, saleGrossTotal - itemDiscountTotal);
        const generalDiscountAmount = getDiscountAmount(
            saleAfterItemDiscount,
            generalDiscountType,
            parsePositiveNumber(generalDiscountValue)
        );
        const saleNetTotal = Math.max(0, saleAfterItemDiscount - generalDiscountAmount);
        return { purchaseTotal, saleGrossTotal, itemDiscountTotal, generalDiscountAmount, saleNetTotal, marginEstimate: saleNetTotal - purchaseTotal };
    }, [rows, generalDiscountType, generalDiscountValue]);

    const filledProductsCount = rows.filter((row) => row.product).length;
    const hasAtLeastOneValidLine = rows.some((row) => row.product && row.quantity > 0);
    const pendingQuotesCount = quotes.filter((quote) => quote.status === "PENDENTE").length;
    const soldQuotesCount = quotes.filter((quote) => quote.status === "VENDIDO").length;
    const err = (key: string) => formErrors[key]?.[0];

    const updateLine = (lineId: string, patch: Partial<QuoteLineForm>) => {
        setLines((prev) => prev.map((line) => (line.lineId === lineId ? { ...line, ...patch } : line)));
    };

    const addLine = () => {
        setLines((prev) => [...prev, { lineId: `line-${lineCounterRef.current}`, productId: "", quantity: "1", discountType: "amount", discountValue: "" }]);
        lineCounterRef.current += 1;
    };

    const removeLine = (lineId: string) => {
        setLines((prev) => {
            if (prev.length === 1) return [{ ...prev[0], productId: "", quantity: "1", discountType: "amount", discountValue: "" }];
            return prev.filter((line) => line.lineId !== lineId);
        });
    };

    const resetForm = () => {
        setSelectedClientId("");
        setQuoteTitle("");
        setGeneralDiscountType("amount");
        setGeneralDiscountValue("");
        setNotes("");
        setFormErrors({});
        lineCounterRef.current = 2;
        setLines([{ lineId: "line-1", productId: "", quantity: "1", discountType: "amount", discountValue: "" }]);
    };

    const pushFilters = (nextPage: number, nextSearch: string, nextStatus: QuoteListStatusFilter) => {
        const params = new URLSearchParams();
        const normalizedSearch = nextSearch.trim();
        if (normalizedSearch) params.set("search", normalizedSearch);
        if (nextStatus !== "ALL") params.set("status", nextStatus);
        if (nextPage > 1) params.set("page", String(nextPage));
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    };

    const handleSearch = () => pushFilters(1, search, statusFilter);

    const clearSearch = () => {
        setSearch("");
        setStatusFilter("ALL");
        router.push(pathname);
    };

    const buildPayload = (): CreateQuotePayload => ({
        clientId: Number(selectedClientId),
        title: quoteTitle.trim() || null,
        notes: notes.trim() || null,
        generalDiscountType,
        generalDiscountValue: parsePositiveNumber(generalDiscountValue),
        items: rows
            .filter((row) => row.product && row.quantity > 0)
            .map((row) => ({
                productId: row.product!.id,
                quantity: row.quantity,
                discountType: row.line.discountType,
                discountValue: parsePositiveNumber(row.line.discountValue),
            })),
    });

    const finalizeQuote = () => {
        if (!selectedClientId) return toast.error("Selecione um cliente para finalizar o orcamento.");
        if (!hasAtLeastOneValidLine) return toast.error("Adicione ao menos um produto com quantidade maior que zero.");

        const formData = new FormData();
        formData.set("payload", JSON.stringify(buildPayload()));
        setFormErrors({});

        startCreating(async () => {
            const result = await createQuoteAction(formData);
            if (!result.ok) {
                if (result.fieldErrors) setFormErrors(result.fieldErrors);
                return toast.error(result.message);
            }

            toast.success(result.message);
            setLastCreatedQuoteId(result.quoteId ?? null);
            resetForm();
            router.refresh();
        });
    };

    const sellQuote = (quoteId: number) => {
        const formData = new FormData();
        formData.set("quoteId", String(quoteId));
        setSellingQuoteId(quoteId);

        startSelling(async () => {
            const result = await markQuoteAsSoldAction(formData);
            setSellingQuoteId(null);

            if (!result.ok) return toast.error(result.message);

            toast.success(result.message);
            if (lastCreatedQuoteId === quoteId) setLastCreatedQuoteId(null);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Clientes Ativos</CardTitle>
                        <Users className="size-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{clients.length}</p>
                        <p className="text-sm text-muted-foreground">Disponiveis para orcamento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Produtos Ativos</CardTitle>
                        <Package className="size-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{products.length}</p>
                        <p className="text-sm text-muted-foreground">Disponiveis para selecao</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Orcamentos na Pagina</CardTitle>
                        <CheckCircle2 className="size-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            <span className="font-semibold text-amber-600">{pendingQuotesCount}</span> pendentes e{" "}
                            <span className="font-semibold text-emerald-600">{soldQuotesCount}</span> vendidos
                        </p>
                        <p className="text-sm text-muted-foreground">Total filtrado: {pagination.total}</p>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Dados do Orcamento</CardTitle>
                        <CardDescription>Selecione o cliente e configure descontos gerais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FieldGroup className="space-y-4">
                            <Field>
                                <FieldLabel htmlFor="clientId">Cliente</FieldLabel>
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger id="clientId" className="w-full">
                                        <SelectValue placeholder="Selecione um cliente ativo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={String(client.id)}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {err("clientId") && <p className="text-sm text-destructive">{err("clientId")}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="quoteTitle">Titulo do Orcamento</FieldLabel>
                                <Input id="quoteTitle" value={quoteTitle} onChange={(e) => setQuoteTitle(e.target.value)} />
                                {err("title") && <p className="text-sm text-destructive">{err("title")}</p>}
                            </Field>
                            <Field>
                                <FieldLabel>Desconto Geral</FieldLabel>
                                <div className="flex gap-2">
                                    <Select value={generalDiscountType} onValueChange={(value) => setGeneralDiscountType(value as QuoteDiscountType)}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="amount">Valor (R$)</SelectItem>
                                            <SelectItem value="percent">Percentual (%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input value={generalDiscountValue} onChange={(e) => setGeneralDiscountValue(e.target.value)} />
                                </div>
                                {err("generalDiscountValue") && <p className="text-sm text-destructive">{err("generalDiscountValue")}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                                {err("notes") && <p className="text-sm text-destructive">{err("notes")}</p>}
                            </Field>
                        </FieldGroup>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Produtos do Orcamento</CardTitle>
                            <CardDescription>Adicione produtos, quantidade e desconto por item</CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={addLine}>
                            <Plus />
                            Adicionar item
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Qtd</TableHead>
                                    <TableHead>Compra Unit.</TableHead>
                                    <TableHead>Venda Unit.</TableHead>
                                    <TableHead>Desconto</TableHead>
                                    <TableHead>Total Compra</TableHead>
                                    <TableHead>Total Venda</TableHead>
                                    <TableHead className="text-right">Acao</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.line.lineId}>
                                        <TableCell className="min-w-[250px]">
                                            <Select value={row.line.productId} onValueChange={(value) => updateLine(row.line.lineId, { productId: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um produto" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((product) => (
                                                        <SelectItem key={product.id} value={String(product.id)}>
                                                            {product.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="min-w-[110px]">
                                            <Input type="number" min={0} step="1" value={row.line.quantity} onChange={(e) => updateLine(row.line.lineId, { quantity: e.target.value })} />
                                        </TableCell>
                                        <TableCell>{row.product ? brl.format(row.product.purchasePrice) : "-"}</TableCell>
                                        <TableCell>{row.product ? brl.format(row.product.salePrice) : "-"}</TableCell>
                                        <TableCell className="min-w-[220px]">
                                            <div className="flex gap-2">
                                                <Select value={row.line.discountType} onValueChange={(value) => updateLine(row.line.lineId, { discountType: value as QuoteDiscountType })}>
                                                    <SelectTrigger className="w-[110px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="amount">R$</SelectItem>
                                                        <SelectItem value="percent">%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input value={row.line.discountValue} onChange={(e) => updateLine(row.line.lineId, { discountValue: e.target.value })} />
                                            </div>
                                        </TableCell>
                                        <TableCell>{brl.format(row.totalPurchase)}</TableCell>
                                        <TableCell>{brl.format(row.totalSaleNet)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(row.line.lineId)}>
                                                <Trash2 />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {err("items") && <p className="mt-3 text-sm text-destructive">{err("items")}</p>}
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="size-5" />
                            Resumo de Valores
                        </CardTitle>
                        <CardDescription>Calculos baseados no cadastro de produtos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Itens selecionados</span><span className="font-medium">{filledProductsCount}</span></div>
                        <div className="flex justify-between"><span>Total compra</span><span className="font-medium">{brl.format(totals.purchaseTotal)}</span></div>
                        <div className="flex justify-between"><span>Total venda bruto</span><span className="font-medium">{brl.format(totals.saleGrossTotal)}</span></div>
                        <div className="flex justify-between"><span>Desconto itens</span><span className="font-medium text-red-600">- {brl.format(totals.itemDiscountTotal)}</span></div>
                        <div className="flex justify-between"><span>Desconto geral</span><span className="font-medium text-red-600">- {brl.format(totals.generalDiscountAmount)}</span></div>
                        <div className="h-px bg-border" />
                        <div className="flex justify-between text-base"><span className="font-semibold">Total venda liquido</span><span className="font-semibold">{brl.format(totals.saleNetTotal)}</span></div>
                        <div className="flex justify-between"><span>Margem estimada</span><span className={`font-medium ${totals.marginEstimate >= 0 ? "text-emerald-600" : "text-red-600"}`}>{brl.format(totals.marginEstimate)}</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Acoes</CardTitle>
                        <CardDescription>Fluxo real: pendente e vendido com baixa de estoque</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button type="button" className="w-full" onClick={finalizeQuote} disabled={creating}>
                            <ShoppingCart />
                            {creating ? "Finalizando..." : "Finalizar Orcamento"}
                        </Button>
                        <Button type="button" variant="outline" className="w-full" onClick={() => lastCreatedQuoteId ? toast.info(`PDF para #${lastCreatedQuoteId} em proximo passo.`) : toast.error("Finalize um orcamento primeiro.")}>
                            <FileText />
                            Gerar PDF
                        </Button>
                        <Button type="button" variant="outline" className="w-full" onClick={() => lastCreatedQuoteId ? toast.info(`Imagem para #${lastCreatedQuoteId} em proximo passo.`) : toast.error("Finalize um orcamento primeiro.")}>
                            <ImageIcon />
                            Gerar Imagem
                        </Button>
                        <Button type="button" variant="secondary" className="w-full" disabled={!lastCreatedQuoteId || selling} onClick={() => sellQuote(lastCreatedQuoteId!)}>
                            <Package />
                            Marcar Ultimo como Vendido
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={resetForm}>Limpar Formulario</Button>
                    </CardContent>
                </Card>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Pesquisar por codigo, titulo, cliente..."
                        className="md:w-[320px]"
                    />
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QuoteListStatusFilter)}>
                        <SelectTrigger className="md:w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="PENDENTE">Pendentes</SelectItem>
                            <SelectItem value="VENDIDO">Vendidos</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={handleSearch}><Search />Buscar</Button>
                    <Button type="button" variant="ghost" onClick={clearSearch}>Limpar</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Orcamentos Cadastrados</CardTitle>
                        <CardDescription>Pendentes e vendidos, com busca e paginacao</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Codigo</TableHead>
                                    <TableHead>Titulo</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Itens</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total Liquido</TableHead>
                                    <TableHead>Criado</TableHead>
                                    <TableHead>Vendido</TableHead>
                                    <TableHead className="text-right">Acoes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotes.map((quote) => (
                                    <TableRow key={quote.id}>
                                        <TableCell>#{quote.id}</TableCell>
                                        <TableCell>{quote.title ?? "-"}</TableCell>
                                        <TableCell>{quote.clientName}</TableCell>
                                        <TableCell>{quote.itemsCount}</TableCell>
                                        <TableCell><span className={statusClass(quote.status)}>{statusLabel(quote.status)}</span></TableCell>
                                        <TableCell>{brl.format(quote.saleNetTotal)}</TableCell>
                                        <TableCell>{formatInAppTimeZone(quote.createdAt, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
                                        <TableCell>{quote.soldAt ? formatInAppTimeZone(quote.soldAt, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                                        <TableCell className="text-right">
                                            {quote.status === "PENDENTE" ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => sellQuote(quote.id)}
                                                    disabled={selling && sellingQuoteId === quote.id}
                                                >
                                                    {selling && sellingQuoteId === quote.id ? "Marcando..." : "Marcar vendido"}
                                                </Button>
                                            ) : (
                                                <span className="text-sm text-emerald-600">Concluido</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {quotes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                                            Nenhum orcamento encontrado para os filtros informados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => pushFilters(pagination.page - 1, search, statusFilter)}>Anterior</Button>
                                {getVisiblePages(pagination.page, pagination.totalPages).map((pageNumber) => (
                                    <Button key={pageNumber} type="button" size="sm" variant={pageNumber === pagination.page ? "default" : "outline"} onClick={() => pushFilters(pageNumber, search, statusFilter)}>
                                        {pageNumber}
                                    </Button>
                                ))}
                                <Button type="button" variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => pushFilters(pagination.page + 1, search, statusFilter)}>Proxima</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
