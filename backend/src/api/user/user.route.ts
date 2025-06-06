import { Server } from "@hapi/hapi";
import { UsersHandler } from "./user.handler";
import { container } from "tsyringe";

export const UserRoutes = (server: Server, prefix: string) => {
    const usersHandler = container.resolve(UsersHandler);

    // Start Users Routes
    server.route([
        {
            method: "POST",
            path: `/${prefix}/users/client`,
            handler: usersHandler.registerUserRoleHandler.bind(usersHandler)
        },
        {
            method: "POST",
            path: `/${prefix}/users/admin`,
            handler: usersHandler.registerAdminRoleHandler.bind(usersHandler)
        },
        {
            method: "POST",
            path: `/${prefix}/users/moderator`,
            handler: usersHandler.registerModeratorRoleHandler.bind(usersHandler)
        },
        {
            method: "POST",
            path: `/${prefix}/users/login`,
            handler: usersHandler.loginUserHandler.bind(usersHandler)
        },
        {
            method: "GET",
            path: `/${prefix}/users`,
            handler: usersHandler.getUserByIdHandler.bind(usersHandler),
            options: {
                auth: "jwt_auth"
            }
        },
        {
            method: "PUT",
            path: `/${prefix}/users/update`,
            handler: usersHandler.updateUserHandler.bind(usersHandler),
            options: {
                auth: "jwt_auth"
            }
        },
        {
            method: "DELETE",
            path: `/${prefix}/users/logout/{sessionId}`,
            handler: usersHandler.logoutUserHandler.bind(usersHandler),
            options: {
                auth: "jwt_auth"
            }
        },
        {
            method: "DELETE",
            path: `/${prefix}/users/{clientId}`,
            handler: usersHandler.deleteUserHandler.bind(usersHandler),
            options: {
                auth: "jwt_auth"
            }
        },
        {
            method: "PATCH",
            path: `/${prefix}/users/{clientId}/undelete`,
            handler: usersHandler.undeleteUserHandler.bind(usersHandler),
            options: {
                auth: "jwt_auth"
            }
        }
    ]);
    // End Users Routes
};
