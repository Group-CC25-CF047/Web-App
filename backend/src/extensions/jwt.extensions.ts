import type { Server } from "@hapi/hapi";
import type { IJwtDecoded } from "../dto/session.dto";
import Jwt from "@hapi/jwt";
import { Config } from "../config";

interface JwtCredentials {
    id: string;
    role: string;
}

interface JwtValidationResult {
    isValid: boolean;
    credentials: JwtCredentials;
}

interface JwtOptions {
    keys: string;
    verify: {
        aud: boolean;
        iss: boolean;
        sub: boolean;
        maxAgeSec: number;
    };
    validate: (payload: IJwtDecoded) => JwtValidationResult;
}

const validateJwtToken = (payload: IJwtDecoded): JwtValidationResult => {
    return {
        isValid: true,
        credentials: {
            id: payload.decoded.payload.id,
            role: payload.decoded.payload.role
        }
    };
};

const getJwtOptions = (): JwtOptions => ({
    keys: Config.key.accessJwtKey,
    verify: {
        aud: false,
        iss: false,
        sub: false,
        maxAgeSec: Config.ttl.jwt
    },
    validate: validateJwtToken
});

export const JwtExtension = {
    name: "extension/jwt",
    version: "1.0.0",
    register: async (server: Server): Promise<void> => {
        await server.register(Jwt);
        server.auth.strategy("jwt_auth", "jwt", getJwtOptions());
    }
} as const;
