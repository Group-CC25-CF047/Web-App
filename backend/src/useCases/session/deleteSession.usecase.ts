import type { ISessionRepository } from "../../repositories/postgres/session.repository";
import { injectable, inject } from "tsyringe";
import { NotFoundError } from "../errors/notFound.error";
import { ForbiddenError } from "../errors/forbidden.error";

@injectable()
export class DeleteSessionUseCase {
    constructor(
        @inject("SessionRepository") private readonly _sessionRepository: ISessionRepository
    ) {}

    public async execute(sessionId: string, userId: string): Promise<void> {
        const session = await this._sessionRepository.getSession(sessionId);
        if (!session) {
            throw new NotFoundError("Session ID not found.");
        }
        if (userId !== session.user_id) {
            throw new ForbiddenError();
        }
        await this._sessionRepository.deleteSession(sessionId, userId);
    }
}
