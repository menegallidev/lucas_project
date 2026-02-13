import type { ClientStatus, TipoPessoa } from "@prisma/client";

export type ClientRow = {
    id: number;
    personType: TipoPessoa;
    name: string;
    companyName: string | null;
    tradeName: string | null;
    document: string | null;

    email: string | null;
    phone1: string;

    city: string;
    state: string;

    status: ClientStatus;
    createdAt: Date;
    updatedAt: Date;
};

export type ClientListFilters = {
    q?: string;
    status?: ClientStatus;
    personType?: TipoPessoa;
    city?: string;
    state?: string;
};
