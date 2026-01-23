"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCpf } from "@/lib/formatCPF";
import { MoreHorizontalIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type UserRow = { id: number; name: string; cpf: string };

export function UsersClient({ initialUsers, searchParams }: { initialUsers: UserRow[]; searchParams: string; }) {
    const router = useRouter();
    const [search, setSearch] = useState<string>(searchParams);

    function handleSearch() {
        try {
            const formattedSearch = search.trim();

            if (!formattedSearch) {
                router.push("/users");
                return;
            }
            router.push(`/users?search=${encodeURIComponent(formattedSearch)}`);
        } catch (err) {
            toast.error(String((err ?? "")));
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <Field orientation="horizontal">
                    <Input
                        type="search"
                        placeholder="Pesquise por nome ou CPF..."
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
                                aria-label="Adicionar usuário"
                                onClick={() => router.push("/users/new")}
                            >
                                <Plus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Adicionar usuário</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código (ID)</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {initialUsers.map((u) => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.id}</TableCell>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{formatCpf(u.cpf)}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            <MoreHorizontalIcon />
                                            <span className="sr-only">Opções</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/users/${u.id}`)}>
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}

                    {initialUsers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Nenhum usuário encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
