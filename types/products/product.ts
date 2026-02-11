export type DeleteProductState = {
    ok: boolean;
    message?: string;
    attempt: number;
};

export type CreateProductState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};

export type UpdateProductState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};
