import * as Hapi from "@hapi/hapi";
import { Config } from "../config";
import { UsersPlugin } from "../extensions/user.extensions";
import { AuthPlugin } from "../extensions/auth.extensions";
import { JwtExtension } from "../extensions/jwt.extensions";
import { ErrorExtension } from "../extensions/error.extensions";

export const createServer = async (): Promise<Hapi.Server> => {
    // Use CORS origin from config
    const corsOrigin = Config.cors.origin;

    const server = Hapi.server({
        port: Config.server.port,
        host: Config.server.host,
        routes: {
            cors: {
                origin: corsOrigin,
                credentials: true,
                additionalHeaders: [
                    "cache-control",
                    "x-requested-with",
                    "content-type",
                    "accept",
                    "authorization"
                ],
                exposedHeaders: ["content-disposition"]
            }
        }
    });

    // Add root route
    // server.route({
    //     method: "GET",
    //     path: "/",
    //     handler: () => {
    //         return "Server Connected";
    //     }
    // });

    // Add specific OPTIONS handler for preflight requests
    server.route({
        method: "OPTIONS",
        path: "/{any*}",
        handler: (request, h) => {
            return h.response().code(204);
        },
        options: {
            description: "CORS preflight handling",
            tags: ["cors"]
        }
    });

    // Register extensions
    await server.register([ErrorExtension, JwtExtension, UsersPlugin, AuthPlugin]);
    return server;
};

export const shutdownServer = async (server: Hapi.Server): Promise<void> => {
    await server.stop({ timeout: 10000 });
};
