"use client";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClientRow } from "@/types/clients/clientRow";
import { MoreHorizontalIcon, Plus } from "lucide-react";
import { formatPhone } from "@/lib/masks";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteClientAction } from "./actions";
import { DeleteClientState } from "@/types/clients/client";

const initialDeleteState: DeleteClientState = { ok: true, attempt: 0 };

export default function ClientsClient({ initialClients, searchParams }: { initialClients: ClientRow[], searchParams: string }) {
    const router = useRouter();
    const [deleteState, deleteFormAction, deleting] = useActionState(deleteClientAction, initialDeleteState);
    const [search, setSearch] = useState<string>(searchParams);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [, startTransition] = useTransition();

    const handleSearch = () => {
        try {
            const formattedSearch = search.trim();

            if (!formattedSearch) {
                router.push("/clients");
                return;
            }
            router.push(`/clients?search=${encodeURIComponent(formattedSearch)}`);
        } catch (err) {
            toast.error(String((err ?? "")));
        }
    };

    useEffect(() => {
        if (!deleteState.attempt) return;

        if (deleteState.ok) toast.success(deleteState.message ?? "Cliente excluído com sucesso!");
        else toast.error(deleteState.message ?? "Não foi possível excluir.");

        router.refresh();
    }, [deleteState.attempt, deleteState.ok, deleteState.message, router]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Field orientation="horizontal">
                    <Input
                        type="search"
                        placeholder="Pesquise aqui..."
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
                                aria-label="Adicionar cliente"
                                onClick={() => router.push("/clients/new")}
                            >
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Adicionar cliente</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código (ID)</TableHead>

                        {/* novas colunas */}
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Nome fantasia</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>UF</TableHead>
                        <TableHead>Status</TableHead>

                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {initialClients.map((u) => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.id}</TableCell>

                            {/* novas colunas */}
                            <TableCell>{u.personType}</TableCell>
                            <TableCell>{u.name}</TableCell>
                            <TableCell>{u.tradeName ?? "-"}</TableCell>
                            <TableCell>{u.document ?? "-"}</TableCell>
                            <TableCell>{u.email ?? "-"}</TableCell>
                            <TableCell>{formatPhone(u.phone1)}</TableCell>
                            <TableCell>{u.city}</TableCell>
                            <TableCell>{u.state}</TableCell>
                            <TableCell>
                                <span
                                    className={
                                        u.status === "ATIVO"
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                    }
                                >
                                    {u.status}
                                </span>
                            </TableCell>

                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            <MoreHorizontalIcon />
                                            <span className="sr-only">Opções</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/clients/${u.id}`)}>
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <ConfirmDialog
                                            title="Excluir cliente"
                                            description={
                                                <>
                                                    Tem certeza que deseja excluir este cliente? <br />
                                                    Essa ação não pode ser desfeita.
                                                </>
                                            }
                                            confirmText={deleting ? "Excluindo..." : "Excluir"}
                                            cancelText="Cancelar"
                                            confirmVariantClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            trigger={
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        setSelectedClientId(u.id);
                                                    }}
                                                >
                                                    Excluir
                                                </DropdownMenuItem>
                                            }
                                            onConfirm={() => {
                                                if (!selectedClientId) return;

                                                const fd = new FormData();
                                                fd.set("id", String(selectedClientId));

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

                    {initialClients.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={11} className="text-center text-muted-foreground">
                                Nenhum cliente encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
