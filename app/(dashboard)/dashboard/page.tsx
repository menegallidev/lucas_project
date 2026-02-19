import Link from "next/link";
import { CalendarDays, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAgendaEventsByDay } from "@/server/services/agenda.service";
import { listTopSellingProductsByMonth } from "@/server/services/inventory.service";
import { EventDetailsDialog } from "./event-details-dialog";
import { SalesByProductSection } from "./sales-by-product-section";

type DashboardSearchType = Promise<{
    month?: string;
}>;

function toMonthInputValue(date: Date) {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function toMonthDate(monthInput: string) {
    const [year, month] = monthInput.split("-").map(Number);
    return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

function normalizeMonthInput(raw?: string) {
    if (!raw) return undefined;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return undefined;
    return raw;
}

export default async function DashboardPage({ searchParams }: { searchParams?: DashboardSearchType }) {
    const awaitSearchParams = (await searchParams) ?? {};
    const today = new Date();
    const selectedMonth = normalizeMonthInput(awaitSearchParams.month) ?? toMonthInputValue(today);
    const selectedMonthDate = toMonthDate(selectedMonth);

    const events = await listAgendaEventsByDay(today);
    const topSellingProducts = await listTopSellingProductsByMonth(selectedMonthDate);

    return (
        <div className="space-y-6">
            <section className="space-y-3">
                <h1 className="text-xl font-semibold">Atalhos</h1>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle>Cadastro de Clientes</CardTitle>
                                <CardDescription>Acesse listagem e cadastro de clientes</CardDescription>
                            </div>
                            <Users className="size-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/clients">Ir para Clientes</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle>Cadastro de Produtos</CardTitle>
                                <CardDescription>Acesse listagem e cadastro de produtos</CardDescription>
                            </div>
                            <Package className="size-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/products">Ir para Produtos</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold">Eventos de Hoje</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="size-5" />
                            {today.toLocaleDateString("pt-BR", {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {events.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum evento agendado para hoje.</p>
                        ) : (
                            <ul className="space-y-3">
                                {events.map((event) => (
                                    <li key={event.id} className="rounded-md border p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium">{event.title}</p>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(event.startAt).toLocaleTimeString("pt-BR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Cliente: {event.clientName ?? "Nao informado"}
                                        </p>
                                        {event.location && (
                                            <p className="text-sm text-muted-foreground">Local: {event.location}</p>
                                        )}
                                        <div className="mt-2">
                                            <EventDetailsDialog
                                                title={event.title}
                                                startAt={event.startAt}
                                                clientName={event.clientName}
                                                location={event.location}
                                                notes={event.notes}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </section>

            <SalesByProductSection items={topSellingProducts} selectedMonth={selectedMonth} />
        </div>
    );
}
