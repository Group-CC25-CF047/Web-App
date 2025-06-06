import { injectable, inject } from "tsyringe";
import { TokenManager } from "../../utils/token.manager";
import { ForbiddenError } from "../errors/forbidden.error";

@injectable()
export class ValidateTokenUseCase {
    constructor(@inject("TokenManager") private readonly _tokenManager: TokenManager) {}

    public async execute(
        role: string,
        refreshToken: string,
        sessionToken: string
    ): Promise<{ token: string; role: string }> {
        if (refreshToken !== sessionToken) {
            throw new ForbiddenError();
        }
        const tokenPayload = await this._tokenManager.verifyToken(refreshToken);
        if (!tokenPayload) {
            throw new ForbiddenError();
        }
        if (tokenPayload.role !== role) {
            throw new ForbiddenError();
        }
        const accessToken = await this._tokenManager.createAccessToken(tokenPayload);
        return { token: accessToken, role: tokenPayload.role };
    }
}
