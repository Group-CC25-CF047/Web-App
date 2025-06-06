import type { ISessionRepository } from "../../repositories/postgres/session.repository";
import type { IToken } from "../../dto/session.dto";
import { Config } from "../../config";
import { addSeconds } from "date-fns";
import { injectable, inject } from "tsyringe";
import { EncryptionManager } from "../../utils/encryption.manager";

@injectable()
export class CreateSessionUseCase {
    constructor(
        @inject("EncryptionManager") private readonly _encryptionManager: EncryptionManager,
        @inject("SessionRepository") private readonly _sessionRepository: ISessionRepository
    ) {}

    public async execute(tokenData: IToken): Promise<{ token: string; sessionId: string }> {
        const expiresAt = addSeconds(new Date(), Config.ttl.session);
        const encryptedRefreshToken = await this._encryptionManager.seal(tokenData.refresh_token);

        const sessionData = {
            id: "",
            user_id: tokenData.user_id,
            token: encryptedRefreshToken,
            user_agent: tokenData.user_agent,
            expires_at: expiresAt
        };

        const sessionId = await this._sessionRepository.addSession(sessionData);
        return {
            token: tokenData.refresh_token,
            sessionId
        };
    }
}
