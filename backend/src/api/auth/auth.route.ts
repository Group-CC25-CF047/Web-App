import { Server } from "@hapi/hapi";
import { AuthHandler } from "./auth.handler";
import { container } from "tsyringe";

export const AuthRoutes = (server: Server, prefix: string) => {
    const authHandler = container.resolve(AuthHandler);

    // Start Auth Routes
    server.route({
        method: "GET",
        path: `/${prefix}/auths/{sessionId}`,
        handler: authHandler.refreshTokenHandler.bind(authHandler)
    });
    // End Auth Routes
};
