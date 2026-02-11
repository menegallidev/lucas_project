"use client";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductRow } from "@/types/products/productRow";
import { MoreHorizontalIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProductAction } from "./actions";
import { DeleteProductState } from "@/types/products/product";

const initialDeleteState: DeleteProductState = { ok: true, attempt: 0 };

const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export default function ProductsClient({ initialProducts, searchParams }: { initialProducts: ProductRow[]; searchParams: string; }) {
    const router = useRouter();
    const [deleteState, deleteFormAction, deleting] = useActionState(deleteProductAction, initialDeleteState);
    const [search, setSearch] = useState<string>(searchParams);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [, startTransition] = useTransition();

    const handleSearch = () => {
        try {
            const formattedSearch = search.trim();

            if (!formattedSearch) {
                router.push("/products");
                return;
            }
            router.push(`/products?search=${encodeURIComponent(formattedSearch)}`);
        } catch (err) {
            toast.error(String((err ?? "")));
        }
    };

    useEffect(() => {
        if (!deleteState.attempt) return;

        if (deleteState.ok) toast.success(deleteState.message ?? "Produto excluido com sucesso!");
        else toast.error(deleteState.message ?? "Nao foi possivel excluir.");

        router.refresh();
    }, [deleteState.attempt, deleteState.ok, deleteState.message, router]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Field orientation="horizontal">
                    <Input
                        type="search"
                        placeholder="Pesquise por nome, modelo ou observacao..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearch();
                            }
                        }}
                    />
                    <Button type="button" onClick={handleSearch}>
                        Pesquisar
                    </Button>
                </Field>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Adicionar produto"
                                onClick={() => router.push("/products/new")}
                            >
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Adicionar produto</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Codigo (ID)</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Preco</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {initialProducts.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.id}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.model}</TableCell>
                            <TableCell>{brl.format(product.price)}</TableCell>
                            <TableCell>{product.stockQuantity}</TableCell>
                            <TableCell>
                                <span
                                    className={
                                        product.status === "ATIVO"
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                    }
                                >
                                    {product.status}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            <MoreHorizontalIcon />
                                            <span className="sr-only">Opcoes</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <ConfirmDialog
                                            title="Excluir produto"
                                            description={(
                                                <>
                                                    Tem certeza que deseja excluir este produto? <br />
                                                    Essa acao nao pode ser desfeita.
                                                </>
                                            )}
                                            confirmText={deleting ? "Excluindo..." : "Excluir"}
                                            cancelText="Cancelar"
                                            confirmVariantClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            trigger={(
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        setSelectedProductId(product.id);
                                                    }}
                                                >
                                                    Excluir
                                                </DropdownMenuItem>
                                            )}
                                            onConfirm={() => {
                                                if (!selectedProductId) return;

                                                const fd = new FormData();
                                                fd.set("id", String(selectedProductId));

                                                startTransition(() => {
                                                    void deleteFormAction(fd);
                                                });
                                            }}
                                        />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}

                    {initialProducts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                Nenhum produto encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
