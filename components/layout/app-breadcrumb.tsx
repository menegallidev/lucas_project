"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    agenda: "Agenda",
    users: "Usuários",
    clients: "Clientes",
    companies: "Empresas",
    appointments: "Agendamentos",
    "work-orders": "Ordens de Serviço",
    inventory: "Estoque",
    products: "Produtos",
    movements: "Movimentações",
    new: "Novo",
    edit: "Editar",
};

function pretty(segment: string) {
    return LABELS[segment] ?? segment;
}

export function AppBreadcrumb() {
    const pathname = usePathname();
    const parts = pathname.split("?")[0].split("/").filter(Boolean);

    const crumbs = parts.map((part, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const isLast = i === parts.length - 1;
        const label = part.match(/^\d+$/) ? "Detalhes" : pretty(part);

        return { href, label, isLast };
    });

    if (crumbs.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {crumbs.map((c, idx) => (
                    <span key={c.href} className="contents">
                        <BreadcrumbItem className={idx === 0 ? "hidden md:block" : ""}>
                            {c.isLast ? (
                                <BreadcrumbPage>{c.label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link href={c.href}>{c.label}</Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {!c.isLast && <BreadcrumbSeparator className="hidden md:block" />}
                    </span>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
