import { ClientSearchType } from "@/types/clients/search";
import ClientsClient from "./clients-client";
import { listClientsBySearch } from "@/server/services/clients.service";
import { listCompaniesForSelect } from "@/server/services/companies.service";

export default async function ClientsPage({ searchParams }: { searchParams: ClientSearchType }) {
    const awaitSearchParams = (await searchParams) ?? {};
    const search = awaitSearchParams?.search ?? "";
    const rawCompanyId = awaitSearchParams?.companyId ?? "";
    const parsedCompanyId = Number(rawCompanyId);
    const companyId = Number.isInteger(parsedCompanyId) && parsedCompanyId > 0 ? parsedCompanyId : undefined;

    const [clients, companies] = await Promise.all([
        listClientsBySearch(search, companyId),
        listCompaniesForSelect(),
    ]);

    return (
        <ClientsClient
            key={`${search}-${companyId ?? "all"}`}
            initialClients={clients}
            searchParams={search}
            initialCompanies={companies}
            selectedCompanyId={companyId ? String(companyId) : "all"}
        />
    );
}
