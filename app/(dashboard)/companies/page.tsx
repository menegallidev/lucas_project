import { CompanySearchType } from "@/types/companies/search";
import CompaniesClient from "./companies-client";
import { listCompaniesBySearch } from "@/server/services/companies.service";

export default async function CompaniesPage({ searchParams }: { searchParams: CompanySearchType }) {
    const awaitSearchParams = (await searchParams) ?? {};
    const search = awaitSearchParams?.search ?? "";
    const companies = await listCompaniesBySearch(search);

    return <CompaniesClient initialCompanies={companies} searchParams={search} />;
}
