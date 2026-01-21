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
    Settings2
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
            title: "Cadastros",
            url: "#",
            icon: ClipboardList,
            isActive: true,
            items: [
                {
                    title: "Clientes",
                    url: "#",
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
                    title: "Geral",
                    url: "#",
                },
            ],
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarBrand name="Nome da do lucas" subtitle="Painel Administrativo" logoSrc="/perfil-empresa.jpg" />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
