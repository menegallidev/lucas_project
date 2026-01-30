"use client";

import Image from "next/image";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type SidebarBrandProps = {
    name: string;
    subtitle?: string;
    logoSrc?: string;
};

export function SidebarBrand({ name, subtitle = "Gestão", logoSrc = "/logo.png" }: SidebarBrandProps) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className={cn(
                        "cursor-default hover:bg-transparent active:bg-transparent",
                        isCollapsed && "justify-center"
                    )}
                >
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                        <Image src={logoSrc} alt={name} width={32} height={32} className="h-8 w-8 object-cover" />
                    </div>

                    {!isCollapsed && (
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{name}</span>
                            <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
                        </div>
                    )}
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
