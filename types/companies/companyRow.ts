import type { ClientStatus } from "@prisma/client";

export type CompanyRow = {
    id: number;
    name: string;
    tradeName: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    status: ClientStatus;
    createdAt: Date;
    updatedAt: Date;
};
