"use server";

import { listUsersService } from "@/server/services/users.service";

export async function fetchUsers(search: string) {
    const formattedSearch = search.trim();

    return await listUsersService(formattedSearch);
}