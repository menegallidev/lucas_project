export type QuoteClientOption = {
    id: number;
    name: string;
};

export type QuoteProductOption = {
    id: number;
    name: string;
    model: string;
    label: string;
    purchasePrice: number;
    salePrice: number;
    stockQuantity: number;
};

export type QuoteDiscountType = "amount" | "percent";

export type QuoteStatus = "PENDENTE" | "VENDIDO";

export type QuoteLineForm = {
    lineId: string;
    productId: string;
    quantity: string;
    discountType: QuoteDiscountType;
    discountValue: string;
};

export type QuoteItemPayload = {
    productId: number;
    quantity: number;
    discountType: QuoteDiscountType;
    discountValue: number;
};

export type CreateQuotePayload = {
    clientId: number;
    title?: string | null;
    notes?: string | null;
    generalDiscountType: QuoteDiscountType;
    generalDiscountValue: number;
    items: QuoteItemPayload[];
};

export type CreateQuoteState = {
    ok: boolean;
    message: string;
    quoteId?: number;
    fieldErrors?: Record<string, string[]>;
};

export type MarkQuoteAsSoldState = {
    ok: boolean;
    message: string;
    quoteId?: number;
};

export type DeleteQuoteState = {
    ok: boolean;
    message: string;
    quoteId?: number;
};

export type QuoteListStatusFilter = QuoteStatus | "ALL";

export type QuoteListRow = {
    id: number;
    title: string | null;
    clientName: string;
    status: QuoteStatus;
    purchaseTotal: number;
    saleGrossTotal: number;
    saleNetTotal: number;
    createdAt: Date;
    soldAt: Date | null;
    itemsCount: number;
};

export type QuoteListResult = {
    rows: QuoteListRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};
