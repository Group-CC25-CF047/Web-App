import type { IUserRepository } from "../../repositories/postgres/user.repository";
import type { HashManager } from "../../utils/hash.manager";
import type { IUserUpdate } from "../../dto/user.dto";
import { injectable, inject } from "tsyringe";
import { ForbiddenError } from "../errors/forbidden.error";
import { BadRequestError } from "../errors/badRequest.error";

@injectable()
export class UpdateUserUseCase {
    constructor(
        @inject("HashManager") private readonly _hashManager: HashManager,
        @inject("UserRepository") private readonly _userRepository: IUserRepository
    ) {}

    public async execute(role: string, user: IUserUpdate): Promise<void> {
        const existingUser = await this._userRepository.getUserById(user.id);
        if (!existingUser || existingUser.role !== role) {
            throw new ForbiddenError();
        }
        const userCredentials = await this._userRepository.getUserIdAndPasswordByEmail(
            existingUser.email
        );
        if (!userCredentials) {
            throw new ForbiddenError();
        }
        const isPasswordCorrect = await this._hashManager.comparePassword(
            user.password,
            userCredentials.password
        );
        if (!isPasswordCorrect) {
            throw new BadRequestError("Invalid password.");
        }
        await this._userRepository.updateUser(user);
    }
}
