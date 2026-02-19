"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCpf } from "@/lib/formatCPF";
import { formatCnpj } from "@/lib/formatCNPJ";
import { formatPhone } from "@/lib/masks";
import { DeleteCompanyState } from "@/types/companies/company";
import { CompanyRow } from "@/types/companies/companyRow";
import { MoreHorizontalIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCompanyAction } from "./actions";

const initialDeleteState: DeleteCompanyState = { ok: true, attempt: 0 };

export default function CompaniesClient({ initialCompanies, searchParams }: { initialCompanies: CompanyRow[], searchParams: string }) {
    const router = useRouter();
    const [deleteState, deleteFormAction, deleting] = useActionState(deleteCompanyAction, initialDeleteState);
    const [search, setSearch] = useState<string>(searchParams);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [, startTransition] = useTransition();

    const handleSearch = () => {
        try {
            const formattedSearch = search.trim();

            if (!formattedSearch) {
                router.push("/companies");
                return;
            }
            router.push(`/companies?search=${encodeURIComponent(formattedSearch)}`);
        } catch (err) {
            toast.error(String((err ?? "")));
        }
    };

    useEffect(() => {
        if (!deleteState.attempt) return;

        if (deleteState.ok) toast.success(deleteState.message ?? "Empresa excluida com sucesso!");
        else toast.error(deleteState.message ?? "Nao foi possivel excluir.");

        router.refresh();
    }, [deleteState.attempt, deleteState.ok, deleteState.message, router]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Field orientation="horizontal">
                    <Input
                        type="search"
                        placeholder="Pesquise por nome, documento ou email..."
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
                                aria-label="Adicionar empresa"
                                onClick={() => router.push("/companies/new")}
                            >
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Adicionar empresa</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Codigo (ID)</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Nome fantasia</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {initialCompanies.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.id}</TableCell>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.tradeName ?? "-"}</TableCell>

                            <TableCell>
                                {c.document?.length === 11 ? formatCpf(c.document) : c.document?.length === 14 ? formatCnpj(c.document) : "-"}
                            </TableCell>

                            <TableCell>{c.email ?? "-"}</TableCell>
                            <TableCell>{c.phone ? formatPhone(c.phone) : "-"}</TableCell>
                            <TableCell>
                                <span
                                    className={
                                        c.status === "ATIVO"
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                    }
                                >
                                    {c.status}
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
                                        <DropdownMenuItem onClick={() => router.push(`/companies/${c.id}`)}>
                                            Editar
                                        </DropdownMenuItem>
                                        {/* <DropdownMenuSeparator />
                                        <ConfirmDialog
                                            title="Excluir empresa"
                                            description={(
                                                <>
                                                    Tem certeza que deseja excluir esta empresa? <br />
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
                                                        setSelectedCompanyId(c.id);
                                                    }}
                                                >
                                                    Excluir
                                                </DropdownMenuItem>
                                            )}
                                            onConfirm={() => {
                                                if (!selectedCompanyId) return;

                                                const fd = new FormData();
                                                fd.set("id", String(selectedCompanyId));

                                                startTransition(() => {
                                                    void deleteFormAction(fd);
                                                });
                                            }}
                                        /> */}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}

                    {initialCompanies.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                Nenhuma empresa encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
