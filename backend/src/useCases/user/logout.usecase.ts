import { ForbiddenError } from "../errors/forbidden.error";
import { NotFoundError } from "../errors/notFound.error";
import { injectable, inject } from "tsyringe";
import type { IUserRepository } from "../../repositories/postgres/user.repository";

@injectable()
export class LogoutUserUseCase {
    constructor(@inject("UserRepository") private readonly _userRepository: IUserRepository) {}

    public async execute(role: string, userId: string): Promise<void> {
        const user = await this._userRepository.getUserById(userId);
        if (!user) {
            throw new NotFoundError("User ID not found.");
        }
        if (user.role !== role) {
            throw new ForbiddenError();
        }
    }
}
