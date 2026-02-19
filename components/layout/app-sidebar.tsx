"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    ClipboardList,
    CalendarDays,
    Boxes,
    FileText,
    LayoutDashboard,
    Settings2,
} from "lucide-react";
import * as React from "react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarBrand } from "./sidebar-brand";

const data = {
    user: {
        name: "Nome do Usuário",
        email: "",
        avatar: "",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Agenda",
            url: "/agenda",
            icon: CalendarDays,
        },
        {
            title: "Orçamento/Vendas",
            url: "/quotes-sales",
            icon: FileText,
        },

        {
            title: "Estoque",
            url: "/inventory",
            icon: Boxes,
        },
        {
            title: "Cadastros",
            url: "#",
            icon: ClipboardList,
            isActive: true,
            items: [
                {
                    title: "Clientes",
                    url: "/clients",
                },
                {
                    title: "Empresas",
                    url: "/companies",
                },
                {
                    title: "Produtos",
                    url: "/products",
                },
                {
                    title: "Usuários",
                    url: "/users",
                },
            ],
        },
        {
            title: "Configurações",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "Geral - Em Construção",
                    url: "#",
                },
            ],
        },
    ],
};

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & {
    user: { name: string; email: string; avatar: string };
}) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarBrand name="Inova Grelhas Lineares" subtitle="Painel Administrativo" logoSrc="/logo-cut.jpeg" />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
