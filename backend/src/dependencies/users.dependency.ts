import { container } from "tsyringe";
import { UserRepository, type IUserRepository } from "../repositories/postgres/user.repository";
import { RegisterUserUseCase } from "../useCases/user/registration.usecase";
import { GetProfileUserUseCase } from "../useCases/user/getProfile.usecase";
import { LoginUserUseCase } from "../useCases/user/login.usecase";
import { UpdateUserUseCase } from "../useCases/user/update.usecase";
import { LogoutUserUseCase } from "../useCases/user/logout.usecase";
import { DeleteUserUseCase } from "../useCases/user/delete.usecase";
import { UndeleteUserUseCase } from "../useCases/user/undelete.usecase";
import { User } from "../repositories/entities/user.entity";

export const registerUserDependencies = () => {
    container.registerInstance("User", User);
    container.register<IUserRepository>("UserRepository", { useClass: UserRepository });
    container.register<LoginUserUseCase>("LoginUserUseCase", {
        useClass: LoginUserUseCase
    });
    container.register<RegisterUserUseCase>("RegisterUserUseCase", {
        useClass: RegisterUserUseCase
    });
    container.register<GetProfileUserUseCase>("GetProfileUserUseCase", {
        useClass: GetProfileUserUseCase
    });
    container.register<UpdateUserUseCase>("UpdateUserUseCase", {
        useClass: UpdateUserUseCase
    });
    container.register<LogoutUserUseCase>("LogoutUserUseCase", {
        useClass: LogoutUserUseCase
    });
    container.register<DeleteUserUseCase>("DeleteUserUseCase", {
        useClass: DeleteUserUseCase
    });
    container.register<UndeleteUserUseCase>("UndeleteUserUseCase", {
        useClass: UndeleteUserUseCase
    });
};
