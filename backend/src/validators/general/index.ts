import { ApiKeySchema, CookieSchema, IdSchema } from "./general.schema";
import { UnauthorizedError } from "../../useCases/errors/unauthorized.error";
import { InvariantError } from "../../useCases/errors/invariant.error";
import { Config } from "../../config";

export const GeneralValidator = {
    ApiKeyValidation(payload: string) {
        const { error } = ApiKeySchema.validate(payload);
        if (!payload) {
            throw new UnauthorizedError("Unauthorized.");
        }
        if (error) {
            throw new UnauthorizedError("Unauthorized.");
        }
        if (payload !== Config.key.apiKey) {
            throw new UnauthorizedError("Unauthorized.");
        }
    },
    CookieValidation(payload: string) {
        const { error } = CookieSchema.validate(payload);
        if (!payload) {
            throw new UnauthorizedError("Session expired.");
        }
        if (error) {
            throw new UnauthorizedError("Session expired.");
        }
    },
    IdValidation(params: { id: string }) {
        const { error } = IdSchema.validate(params, { abortEarly: false });
        if (error) {
            throw new InvariantError(
                error.details.map(detail => ({
                    field: detail.path[0].toString(),
                    message: detail.message
                }))
            );
        }
    },
    UserAgentValidation(payload: string) {
        if (!payload) {
            throw new UnauthorizedError("Unauthorized.");
        }
    }
};
