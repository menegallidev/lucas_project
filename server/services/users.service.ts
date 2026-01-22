import { usersRepo } from "../repositories/users.repo";

export async function listUsersService(search: string) {
    return await usersRepo.findMany(search);
}