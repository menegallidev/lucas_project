export type AgendaEventRow = {
    id: number;
    title: string;
    startAt: Date;
    location: string | null;
    notes: string | null;
    clientId: number | null;
    clientName: string | null;
};

export type CreateAgendaEventState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};

export type UpdateAgendaEventState = {
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    attempt: number;
};

export type DeleteAgendaEventState = {
    ok: boolean;
    message?: string;
    attempt: number;
};
