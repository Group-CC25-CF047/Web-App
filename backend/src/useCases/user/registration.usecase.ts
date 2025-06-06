import type { IUser } from "../../dto/user.dto";
import type { IUserRepository } from "../../repositories/postgres/user.repository";
import { Config } from "../../config";
import { HashManager } from "../../utils/hash.manager";
import { ConflictError } from "../errors/conflict.error";
import { injectable, inject } from "tsyringe";

@injectable()
export class RegisterUserUseCase {
    private readonly _defaultPhotoUrl = Config.storage.defaultPhoto;

    constructor(
        @inject("HashManager") private readonly _hashManager: HashManager,
        @inject("UserRepository") private readonly _userRepository: IUserRepository
    ) {}

    public async execute(userData: IUser): Promise<string> {
        const userExists = await this._userRepository.checkUserExistsByEmail(userData.email);
        if (userExists) {
            throw new ConflictError("Email already exists.");
        }
        const hashedPassword = await this._hashManager.hashPassword(userData.password);
        const userWithHashedPassword: IUser = {
            ...userData,
            password: hashedPassword,
            photo: this._defaultPhotoUrl
        };
        const userId = await this._userRepository.addUser(userWithHashedPassword);
        return userId;
    }
}
