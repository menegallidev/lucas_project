export type DeleteClientState = {
    ok: boolean;
    message?: string;
    attempt: number;
}

export type CreateClientState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
}