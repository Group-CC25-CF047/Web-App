import { container } from "tsyringe";
import { SessionRepository, type ISessionRepository } from "../repositories/postgres/session.repository";
import { CreateSessionUseCase } from "../useCases/session/createSession.usecase";
import { GetSessionUseCase } from "../useCases/session/getSession.usecase";
import { ValidateTokenUseCase } from "../useCases/session/validateToken.usecase";
import { DeleteSessionUseCase } from "../useCases/session/deleteSession.usecase";
import { Session } from "../repositories/entities/session.entity";

export const registerSessionDependencies = () => {
    container.registerInstance("Session", Session);
    container.register<ISessionRepository>("SessionRepository", { useClass: SessionRepository });
    container.register<CreateSessionUseCase>("CreateSessionUseCase", {
        useClass: CreateSessionUseCase
    });
    container.register<GetSessionUseCase>("GetSessionUseCase", {
        useClass: GetSessionUseCase
    });
    container.register<ValidateTokenUseCase>("ValidateTokenUseCase", {
        useClass: ValidateTokenUseCase
    });
    container.register<DeleteSessionUseCase>("DeleteSessionUseCase", {
        useClass: DeleteSessionUseCase
    });
};
