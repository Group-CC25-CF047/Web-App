import type { IUserRepository } from "../../repositories/postgres/user.repository";
import { injectable, inject } from "tsyringe";
import { ForbiddenError } from "../errors/forbidden.error";
import { NotFoundError } from "../errors/notFound.error";

@injectable()
export class UndeleteUserUseCase {
    constructor(@inject("UserRepository") private readonly _userRepository: IUserRepository) {}

    public async execute(
        adminUserId: string,
        deletedUserId: string,
        adminRole: string
    ): Promise<void> {
        const deletedUser = await this._userRepository.checkDeletedUserExistsById(deletedUserId);
        if (!deletedUser) {
            throw new NotFoundError("User ID not found.");
        }
        const adminUser = await this._userRepository.getUserById(adminUserId);
        if (!adminUser || adminRole !== "admin") {
            throw new ForbiddenError();
        }
        await this._userRepository.undeleteUser(deletedUserId);
    }
}
