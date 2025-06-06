import type { IUser } from "../../dto/user.dto";
import type { IUserLogin, IUserPasswordUpdate, IUserUpdate } from "../../dto/user.dto";
import { InvariantError } from "../../useCases/errors/invariant.error";
import {
    UserRegistrationSchema,
    UserLoginSchema,
    UserPasswordValidationSchema,
    UserUpdateSchema
} from "./user.schema";

const UsersValidator = {
    UserRegistrationValidation(payload: IUser) {
        const { error } = UserRegistrationSchema.validate(payload, { abortEarly: false });
        if (error) {
            throw new InvariantError(
                error.details.map(detail => ({
                    field: detail.path[0].toString(),
                    message: detail.message
                }))
            );
        }
    },
    UserLoginValidation(payload: IUserLogin) {
        const { error } = UserLoginSchema.validate(payload, { abortEarly: false });
        if (error) {
            throw new InvariantError(
                error.details.map(detail => ({
                    field: detail.path[0].toString(),
                    message: detail.message
                }))
            );
        }
    },
    UserPasswordValidation(payload: IUserPasswordUpdate) {
        const { error } = UserPasswordValidationSchema.validate(payload, { abortEarly: false });
        if (error) {
            throw new InvariantError(
                error.details.map(detail => ({
                    field: detail.path[0].toString(),
                    message: detail.message
                }))
            );
        }
    },
    UserUpdateValidation(payload: IUserUpdate) {
        if (!payload) {
            throw new InvariantError([
                {
                    field: "payload",
                    message: "Payload is required"
                }
            ]);
        }
        const { error } = UserUpdateSchema.validate(payload, { abortEarly: false });
        if (error) {
            throw new InvariantError(
                error.details.map(detail => ({
                    field: detail.path[0].toString(),
                    message: detail.message
                }))
            );
        }
    }
};

export { UsersValidator };
