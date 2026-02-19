import { listActiveClientsForSelect } from "@/server/services/agenda.service";
import { listActiveProductsForQuoteSelect } from "@/server/services/products.service";
import { listQuotesPaginated } from "@/server/services/quotes.service";
import type { QuoteListStatusFilter } from "@/types/quotes/quote";
import type { QuoteSearchType } from "@/types/quotes/search";
import QuotesSalesClient from "./quotes-sales-client";

const ALLOWED_STATUS: QuoteListStatusFilter[] = ["ALL", "PENDENTE", "VENDIDO"];

function parseStatus(value?: string): QuoteListStatusFilter {
    if (value && ALLOWED_STATUS.includes(value as QuoteListStatusFilter)) {
        return value as QuoteListStatusFilter;
    }

    return "ALL";
}

function parsePage(value?: string) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return 1;
    return parsed;
}

export default async function QuotesSalesPage({ searchParams }: { searchParams: QuoteSearchType }) {
    const awaitSearchParams = (await searchParams) ?? {};
    const search = (awaitSearchParams.search ?? "").trim();
    const status = parseStatus(awaitSearchParams.status);
    const page = parsePage(awaitSearchParams.page);

    const [clients, products, quotes] = await Promise.all([
        listActiveClientsForSelect(),
        listActiveProductsForQuoteSelect(),
        listQuotesPaginated({
            page,
            pageSize: 10,
            search,
            status,
        }),
    ]);

    return (
        <QuotesSalesClient
            clients={clients}
            products={products}
            quotes={quotes.rows}
            pagination={{
                page: quotes.page,
                pageSize: quotes.pageSize,
                total: quotes.total,
                totalPages: quotes.totalPages,
            }}
            filters={{
                search,
                status,
            }}
        />
    );
}
