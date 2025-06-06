import { Server } from "@hapi/hapi";
import { UserRoutes } from "../api/user/user.route";

export const UsersPlugin = {
    name: "plugin/users",
    version: "1.0.0",
    dependencies: [],
    register: async (server: Server) => {
        UserRoutes(server, "v1");
    }
};
