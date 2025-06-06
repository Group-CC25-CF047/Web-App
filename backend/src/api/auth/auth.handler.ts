import { GetSessionUseCase } from "../../useCases/session/getSession.usecase";
import { ValidateTokenUseCase } from "../../useCases/session/validateToken.usecase";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { Config } from "../../config";
import { inject, injectable } from "tsyringe";
import { GeneralValidator } from "../../validators/general";

@injectable()
export class AuthHandler {
    constructor(
        @inject("GetSessionUseCase") private readonly _getSessionUseCase: GetSessionUseCase,
        @inject("ValidateTokenUseCase")
        private readonly _validateTokenUseCase: ValidateTokenUseCase
    ) {}

    public async refreshTokenHandler(request: Request, h: ResponseToolkit) {
        const apiKey = request.headers["x-api-key"] as string;
        const { sessionId } = request.params;
        GeneralValidator.IdValidation({ id: sessionId });
        const userSession = await this._getSessionUseCase.execute(sessionId);
        const refreshToken = request.state[`refresh_token_${userSession.role}`];
        console.log(`Refresh token for role ${userSession.role}:`, refreshToken);
        GeneralValidator.ApiKeyValidation(apiKey);
        GeneralValidator.CookieValidation(refreshToken);
        const token = await this._validateTokenUseCase.execute(
            userSession.role,
            refreshToken,
            userSession.token
        );
        const cookieName = `refresh_token_${token.role}`;
        if (!token) {
            return h
                .response({
                    status: "error",
                    message: "Session expired."
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
                .code(404);
        }

        return h
            .response({
                status: "success",
                message: "Token refreshed successfully.",
                data: {
                    access_token: token.token
                }
            })
            .code(200);
    }
}
