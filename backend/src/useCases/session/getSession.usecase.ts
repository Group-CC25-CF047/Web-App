import type { ISessionRepository } from "../../repositories/postgres/session.repository";
import type { IUserRepository } from "../../repositories/postgres/user.repository";
import { injectable, inject } from "tsyringe";
import { ForbiddenError } from "../errors/forbidden.error";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { EncryptionManager } from "../../utils/encryption.manager";

@injectable()
export class GetSessionUseCase {
    constructor(
        @inject("UserRepository") private readonly _userRepository: IUserRepository,
        @inject("EncryptionManager") private readonly _encryptionManager: EncryptionManager,
        @inject("SessionRepository") private readonly _sessionRepository: ISessionRepository
    ) {}

    public async execute(id: string): Promise<{ token: string; role: string }> {
        const session = await this._sessionRepository.getSession(id);
        if (!session) {
            throw new UnauthorizedError("Session expired or not found.");
        }
        const user = await this._userRepository.getUserById(session.user_id);
        if (!user) {
            throw new ForbiddenError();
        }
        if (new Date(session.expires_at) <= new Date()) {
            await this._sessionRepository.deleteExpiredSessions();
        }
        const decryptedToken = await this._encryptionManager.unseal<string>(session.token);
        return {
            token: decryptedToken,
            role: user.role
        };
    }
}
