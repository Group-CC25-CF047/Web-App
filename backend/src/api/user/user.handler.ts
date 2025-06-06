import type { Request, ResponseToolkit } from "@hapi/hapi";
import type { IUser, IUserLogin, IUserUpdate } from "../../dto/user.dto";
import type { IJwtPayload } from "../../dto/session.dto";
import type { RegisterUserUseCase } from "../../useCases/user/registration.usecase";
import type { GetProfileUserUseCase } from "../../useCases/user/getProfile.usecase";
import type { LoginUserUseCase } from "../../useCases/user/login.usecase";
import type { UpdateUserUseCase } from "../../useCases/user/update.usecase";
import type { LogoutUserUseCase } from "../../useCases/user/logout.usecase";
import type { DeleteUserUseCase } from "../../useCases/user/delete.usecase";
import type { UndeleteUserUseCase } from "../../useCases/user/undelete.usecase";
import type { CreateSessionUseCase } from "../../useCases/session/createSession.usecase";
import type { DeleteSessionUseCase } from "../../useCases/session/deleteSession.usecase";
import { Config } from "../../config";
import { injectable, inject } from "tsyringe";
import { UsersValidator } from "../../validators/user";
import { GeneralValidator } from "../../validators/general";

@injectable()
export class UsersHandler {
    constructor(
        @inject("LoginUserUseCase") private readonly _loginUserUseCase: LoginUserUseCase,
        @inject("UpdateUserUseCase") private readonly _updateUserUseCase: UpdateUserUseCase,
        @inject("LogoutUserUseCase") private readonly _logoutUserUseCase: LogoutUserUseCase,
        @inject("DeleteUserUseCase") private readonly _deleteUserUseCase: DeleteUserUseCase,
        @inject("RegisterUserUseCase") private readonly _registerUserUseCase: RegisterUserUseCase,
        @inject("UndeleteUserUseCase") private readonly _undeleteUserUseCase: UndeleteUserUseCase,
        @inject("CreateSessionUseCase")
        private readonly _createSessionUseCase: CreateSessionUseCase,
        @inject("DeleteSessionUseCase")
        private readonly _deleteSessionUseCase: DeleteSessionUseCase,
        @inject("GetProfileUserUseCase")
        private readonly _getProfileUserUseCase: GetProfileUserUseCase
    ) {}

    private async _registerUserHandler(request: Request, h: ResponseToolkit, role: string) {
        const apiKey = request.headers["x-api-key"] as string;
        const payload = request.payload as IUser;
        GeneralValidator.ApiKeyValidation(apiKey);
        UsersValidator.UserRegistrationValidation(payload);
        const restPayload: IUser = { ...payload, role };
        const userId = await this._registerUserUseCase.execute(restPayload);
        return h
            .response({
                status: "success",
                message: `User created successfully.`,
                data: {
                    user_id: userId
                }
            })
            .code(201);
    }

    public async registerUserRoleHandler(request: Request, h: ResponseToolkit) {
        return this._registerUserHandler(request, h, "client");
    }

    public async registerAdminRoleHandler(request: Request, h: ResponseToolkit) {
        return this._registerUserHandler(request, h, "admin");
    }

    public async registerModeratorRoleHandler(request: Request, h: ResponseToolkit) {
        return this._registerUserHandler(request, h, "moderator");
    }

    public async loginUserHandler(request: Request, h: ResponseToolkit) {
        const apiKey = request.headers["x-api-key"] as string;
        const user_agent = request.headers["user-agent"] as string;
        const payload = request.payload as IUserLogin;
        GeneralValidator.ApiKeyValidation(apiKey);
        GeneralValidator.UserAgentValidation(user_agent);
        UsersValidator.UserLoginValidation(payload);
        const token = await this._loginUserUseCase.execute(payload.email, payload.password);
        const session = await this._createSessionUseCase.execute({ user_agent, ...token });
        const cookieName = `refresh_token_${token.role}`;
        return h
            .response({
                status: "success",
                message: "User logged in successfully.",
                data: {
                    session_id: session.sessionId,
                    access_token: token.access_token
                }
            })
            .unstate(cookieName)
            .state(cookieName, session.token, {
                isSecure: Config.cookie.isSecure,
                isHttpOnly: Config.cookie.isHttpOnly,
                domain: "." + Config.cookie.domain,
                isSameSite: Config.cookie.isSameSite,
                path: "/"
            })
            .code(200);
    }

    public async getUserByIdHandler(request: Request, h: ResponseToolkit) {
        const { id, role } = request.auth.credentials as unknown as IJwtPayload;
        GeneralValidator.IdValidation({ id });
        const user = await this._getProfileUserUseCase.execute(id, role);
        return h
            .response({
                status: "success",
                message: "User retrieved successfully.",
                data: {
                    user
                }
            })
            .code(200);
    }

    public async updateUserHandler(request: Request, h: ResponseToolkit) {
        const { id, role } = request.auth.credentials as unknown as IJwtPayload;
        const payload = request.payload as IUserUpdate;
        GeneralValidator.IdValidation({ id });
        UsersValidator.UserUpdateValidation(payload);
        await this._updateUserUseCase.execute(role, { ...payload, id });
        return h
            .response({
                status: "success",
                message: "User updated successfully."
            })
            .code(200);
    }

    public async logoutUserHandler(request: Request, h: ResponseToolkit) {
        const { id, role } = request.auth.credentials as unknown as IJwtPayload;
        const { sessionId } = request.params;
        GeneralValidator.IdValidation({ id });
        GeneralValidator.IdValidation({ id: sessionId });
        await this._logoutUserUseCase.execute(role, id);
        await this._deleteSessionUseCase.execute(sessionId, id);
        const cookieName = `refresh_token_${role}`;
        return h
            .response({
                status: "success",
                message: "User logged out successfully."
            })
            .unstate(cookieName)
            .state(cookieName, "", {
                ttl: 0,
                isSecure: Config.cookie.isSecure,
                isHttpOnly: Config.cookie.isHttpOnly,
                domain: "." + Config.cookie.domain,
                isSameSite: Config.cookie.isSameSite,
                path: "/"
            })
            .code(200);
    }

    public async deleteUserHandler(request: Request, h: ResponseToolkit) {
        const { id, role } = request.auth.credentials as unknown as IJwtPayload;
        const { clientId } = request.params;
        GeneralValidator.IdValidation({ id });
        GeneralValidator.IdValidation({ id: clientId });
        await this._deleteUserUseCase.execute(id, clientId, role);
        return h
            .response({
                status: "success",
                message: "User deleted successfully."
            })
            .code(200);
    }

    public async undeleteUserHandler(request: Request, h: ResponseToolkit) {
        const { id, role } = request.auth.credentials as unknown as IJwtPayload;
        const { clientId } = request.params;
        GeneralValidator.IdValidation({ id });
        GeneralValidator.IdValidation({ id: clientId });
        await this._undeleteUserUseCase.execute(id, clientId, role);
        return h
            .response({
                status: "success",
                message: "User undeleted successfully."
            })
            .code(200);
    }
}
