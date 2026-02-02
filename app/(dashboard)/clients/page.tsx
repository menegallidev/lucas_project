import { ClientSearchType } from "@/types/clients/search";
import ClientsClient from "./clients-client";
import { listClientsBySearch } from "@/server/services/clients.service";

export default async function ClientsPage({ searchParams }: { searchParams: ClientSearchType }) {
    const awaitSearchParams = (await searchParams) ?? {};
    const search = awaitSearchParams?.search ?? "";
    const clients = await listClientsBySearch(search);

    console.log({ clients });

    return <ClientsClient initialClients={clients} searchParams={search} />;
}