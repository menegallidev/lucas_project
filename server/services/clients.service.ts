import { ClientRow } from "@/types/clients/clientRow";

export async function listClientsBySearch(search: string): Promise<ClientRow[]> {

    return [
        {
            id: 1,
            personType: "PF",
            name: "Rafael",
            tradeName: "Rafael nome fantasia",
            document: "12312312312",

            email: "rafaelmenegalli@gmail.com",
            phone1: "19996282121",

            city: "Goiás",
            state: "SP",

            status: "ATIVO",
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];
}