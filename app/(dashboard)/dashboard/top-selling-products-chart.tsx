"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopSellingProductRow } from "@/types/inventory/top-selling";
import { Loader2 } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const quantityFormatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
});

const chartConfig = {
    quantitySold: {
        label: "Quantidade vendida",
        color: "var(--chart-1)",
    },
    totalSold: {
        label: "Valor total vendido",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

function truncateLabel(label: string) {
    if (label.length <= 14) return label;
    return `${label.slice(0, 14)}...`;
}

export function TopSellingProductsChart({
    items,
    selectedMonthLabel,
    loading = false,
}: {
    items: TopSellingProductRow[];
    selectedMonthLabel: string;
    loading?: boolean;
}) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 produtos mais vendidos</CardTitle>
                    <CardDescription>{selectedMonthLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando dados do grafico...
                    </div>
                    <Skeleton className="h-[380px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (items.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 produtos mais vendidos</CardTitle>
                    <CardDescription>{selectedMonthLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Nenhuma saida de produto foi registrada neste mes.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const chartData = items.map((item) => ({
        ...item,
        productLabel: `${item.productName} (${item.productModel})`,
        shortLabel: truncateLabel(item.productName),
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 10 produtos mais vendidos</CardTitle>
                <CardDescription>{selectedMonthLabel}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[380px] w-full">
                    <ComposedChart data={chartData} margin={{ top: 16, right: 24, left: 4, bottom: 32 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="shortLabel"
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={70}
                        />
                        <YAxis
                            yAxisId="qty"
                            tickFormatter={(value: number) => quantityFormatter.format(value)}
                            tickLine={false}
                            axisLine={false}
                            width={72}
                        />
                        <YAxis
                            yAxisId="value"
                            orientation="right"
                            tickFormatter={(value: number) => brl.format(value)}
                            tickLine={false}
                            axisLine={false}
                            width={96}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_, payload) => {
                                        const point = payload?.[0]?.payload as { productLabel?: string } | undefined;
                                        return point?.productLabel ?? "";
                                    }}
                                    formatter={(value, name) => {
                                        if (name === "totalSold") {
                                            return [brl.format(Number(value)), " - Valor total vendido"];
                                        }
                                        return [quantityFormatter.format(Number(value)), " - Quantidade vendida"];
                                    }}
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            yAxisId="qty"
                            dataKey="quantitySold"
                            fill="var(--color-quantitySold)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={34}
                        />
                        <Line
                            yAxisId="value"
                            type="monotone"
                            dataKey="totalSold"
                            stroke="var(--color-totalSold)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
