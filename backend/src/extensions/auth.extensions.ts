import { Server } from "@hapi/hapi";
import { AuthRoutes } from "../api/auth/auth.route";

export const AuthPlugin = {
    name: "plugin/auth",
    version: "1.0.0",
    dependencies: [],
    register: async (server: Server) => {
        AuthRoutes(server, "v1");
    }
};
