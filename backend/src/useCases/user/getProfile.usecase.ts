import type { IUserRepository } from "../../repositories/postgres/user.repository";
import type { IUser } from "../../dto/user.dto";
import { injectable, inject } from "tsyringe";
import { NotFoundError } from "../errors/notFound.error";
import { ForbiddenError } from "../errors/forbidden.error";

@injectable()
export class GetProfileUserUseCase {
    constructor(@inject("UserRepository") private readonly _userRepository: IUserRepository) {}

    public async execute(userId: string, userRole: string): Promise<IUser> {
        const user = await this._userRepository.getUserById(userId);
        if (!user) {
            throw new NotFoundError("User ID not found.");
        }
        if (user.role !== userRole) {
            throw new ForbiddenError();
        }
        return user;
    }
}
