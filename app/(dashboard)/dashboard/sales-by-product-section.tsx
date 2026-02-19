"use client";

import { DatePicker } from "@/components/app/inputs/date-picker";
import { Button } from "@/components/ui/button";
import { formatInAppTimeZone } from "@/lib/date-time";
import type { TopSellingProductRow } from "@/types/inventory/top-selling";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { TopSellingProductsChart } from "./top-selling-products-chart";

function toMonthValue(date: Date) {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function fromMonthValue(raw: string) {
    const [year, month] = raw.split("-").map(Number);
    if (!year || !month) return new Date();
    return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

export function SalesByProductSection({
    items,
    selectedMonth,
}: {
    items: TopSellingProductRow[];
    selectedMonth: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [selectedDate, setSelectedDate] = useState<Date>(() => fromMonthValue(selectedMonth));

    useEffect(() => {
        setSelectedDate(fromMonthValue(selectedMonth));
    }, [selectedMonth]);

    const selectedMonthLabel = useMemo(
        () =>
            formatInAppTimeZone(selectedDate, {
                month: "long",
                year: "numeric",
            }),
        [selectedDate]
    );

    const handleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", toMonthValue(selectedDate));
        const query = params.toString();

        startTransition(() => {
            router.push(query ? `${pathname}?${query}` : pathname);
        });
    };

    const handleCurrentMonth = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("month");
        const query = params.toString();

        startTransition(() => {
            router.push(query ? `${pathname}?${query}` : pathname);
        });
    };

    return (
        <section className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Vendas por Produto</h2>
                    <p className="text-sm text-muted-foreground">
                        Top 10 produtos mais vendidos no mes selecionado.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Data</label>
                        <div className="w-full sm:w-[220px]">
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => {
                                    if (date) setSelectedDate(date);
                                }}
                                placeholder="Selecione a data"
                                disabled={isPending}
                            />
                        </div>
                        {/* <p className="text-xs text-muted-foreground">O filtro considera o mes/ano da data selecionada.</p> */}
                    </div>

                    <Button type="button" onClick={handleFilter} disabled={isPending}>
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        {isPending ? "Filtrando..." : "Filtrar"}
                    </Button>

                    <Button type="button" variant="outline" onClick={handleCurrentMonth} disabled={isPending}>
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        Mes atual
                    </Button>
                </div>
            </div>

            <TopSellingProductsChart items={items} selectedMonthLabel={selectedMonthLabel} loading={isPending} />
        </section>
    );
}
