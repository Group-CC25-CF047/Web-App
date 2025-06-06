import type { IUserRepository } from "../../repositories/postgres/user.repository";
import type { ISessionRepository } from "../../repositories/postgres/session.repository";
import { NotFoundError } from "../errors/notFound.error";
import { ForbiddenError } from "../errors/forbidden.error";
import { injectable, inject } from "tsyringe";

@injectable()
export class DeleteUserUseCase {
    constructor(
        @inject("UserRepository") private readonly _userRepository: IUserRepository,
        @inject("SessionRepository") private readonly _sessionRepository: ISessionRepository
    ) {}

    public async execute(adminId: string, userId: string, role: string): Promise<void> {
        const targetUser = await this._userRepository.getUserById(userId);
        if (!targetUser) {
            throw new NotFoundError("User ID not found.");
        }
        const hasActiveSession = await this._sessionRepository.checkSessionExistByUserId(userId);
        if (hasActiveSession) {
            await this._sessionRepository.deleteSessionByUserId(userId);
        }
        const adminUser = await this._userRepository.getUserById(adminId);
        if (!adminUser || role !== "admin") {
            throw new ForbiddenError();
        }
        await this._userRepository.softDeleteUser(userId);
    }
}
