"use server";

import { CreateClientState, DeleteClientState } from "@/types/clients/client";

export async function createClientAction(prev: CreateClientState, formData: FormData): Promise<CreateClientState> {
    return {
        ok: true, attempt: 1, fieldErrors: {}, message: "Teste"
    };
}

export async function deleteClientAction(prev: DeleteClientState, formData: FormData): Promise<DeleteClientState> {
    return {
        ok: false,
        message: "Mensagem para teste",
        attempt: prev.attempt + 1,
    };
}