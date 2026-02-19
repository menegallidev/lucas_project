import type { QuoteListStatusFilter } from "./quote";

export type QuoteSearchType = Promise<{
    search?: string;
    status?: QuoteListStatusFilter;
    page?: string;
}>;
