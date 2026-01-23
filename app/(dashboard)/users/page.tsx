import { listUsersBySearch } from "@/server/services/users.service";
import { UsersClient } from "./users-client";

type SearchParams = Promise<{ search?: string }>;

export default async function UsersPage({ searchParams }: { searchParams?: SearchParams; }) {
    const awaitSearchParams = (await searchParams) ?? {};
    const search = awaitSearchParams.search ?? "";
    const users = await listUsersBySearch(search);

    return <UsersClient initialUsers={users} searchParams={search} />;
}
