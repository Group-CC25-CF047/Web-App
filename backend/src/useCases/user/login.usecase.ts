import type { IUserRepository } from "../../repositories/postgres/user.repository";
import type { IJwtPayload, IToken } from "../../dto/session.dto";
import { HashManager } from "../../utils/hash.manager";
import { TokenManager } from "../../utils/token.manager";
import { injectable, inject } from "tsyringe";
import { NotFoundError } from "../errors/notFound.error";
import { BadRequestError } from "../errors/badRequest.error";

@injectable()
export class LoginUserUseCase {
    constructor(
        @inject("HashManager") private readonly _hashManager: HashManager,
        @inject("TokenManager") private readonly _tokenManager: TokenManager,
        @inject("UserRepository") private readonly _userRepository: IUserRepository
    ) {}

    public async execute(email: string, password: string): Promise<IToken> {
        const userCredentials = await this._userRepository.getUserIdAndPasswordByEmail(email);
        if (!userCredentials) {
            throw new BadRequestError("Invalid username or password.");
        }
        const isPasswordCorrect = await this._hashManager.comparePassword(
            password,
            userCredentials.password
        );
        if (!isPasswordCorrect) {
            throw new BadRequestError("Invalid username or password.");
        }
        const user = await this._userRepository.getUserById(userCredentials.id);
        if (!user) {
            throw new NotFoundError("User not found.");
        }
        const jwtPayload: IJwtPayload = {
            id: user.id,
            role: user.role
        };
        const [accessToken, refreshToken] = await Promise.all([
            this._tokenManager.createAccessToken(jwtPayload),
            this._tokenManager.createRefreshToken(jwtPayload)
        ]);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            role: user.role,
            user_id: user.id
        };
    }
}
