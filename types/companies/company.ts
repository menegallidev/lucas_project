export type DeleteCompanyState = {
    ok: boolean;
    message?: string;
    attempt: number;
};

export type CreateCompanyState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};

export type UpdateCompanyState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};
