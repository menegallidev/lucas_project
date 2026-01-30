import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authCookie, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const token = (await cookies()).get(authCookie.name)?.value;

    const payload = token ? await verifyAuthToken(token) : null;

    const user = {
        name: String(payload?.name ?? "Usuário"),
        email: "",
        avatar: "",
    };

    return (
        <>
            <SidebarProvider>
                <AppSidebar user={user} />

                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <SidebarTrigger className="-ml-1" />

                        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

                        <AppBreadcrumb />

                        <div className="ml-auto">
                            <ModeToggle />
                        </div>
                    </header>

                    <main className="h-[calc(100dvh-4rem)] overflow-y-auto">
                        <div className="p-4">{children}</div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}