import type { Request, ResponseToolkit, ResponseObject, Server } from "@hapi/hapi";
import { ApplicationError } from "../useCases/errors/application.error";
import { InfrastructureError } from "../repositories/errors/infrastructure.error";
import { LogError } from "../utils/logger.manager";

const handleResponse = (request: Request, h: ResponseToolkit): ResponseObject | symbol => {
    const response = request.response;
    if (!(response instanceof Error)) {
        return h.continue;
    }

    if (response instanceof ApplicationError) {
        return h.response(response.toResponse()).code(response.code);
    }

    // Handle JWT errors
    if (response.output.payload.message === "Token maximum age exceeded") {
        return h
            .response({
                status: "fail",
                message: "Token exceeded maximum age"
            })
            .code(401);
    }

    if (response.output.statusCode === 401 && response.message) {
        return h
            .response({
                status: "fail",
                message: "Unauthorized."
            })
            .code(401);
    }

    // Handle 404 Not Found errors
    if (response.output && response.output.statusCode === 404) {
        return h
            .response({
                status: "fail",
                message: "Resource not found"
            })
            .code(404);
    }

    // Handle JWT errors
    if (response.output.payload.message === "Unsupported Media Type") {
        return h
            .response({
                status: "fail",
                message: "Unsupported Media Type."
            })
            .code(415);
    }

    if (response instanceof InfrastructureError) {
        LogError(response.message);
    } else {
        request.log("error", {
            message: "Unhandled Error",
            errorMessage: response.message,
            request: {
                method: request.method.toUpperCase(),
                path: request.path,
                headers: request.headers,
                payload: request.payload
            }
        });

        console.error(response);
    }

    const errorResponse: ResponseObject = h.response({
        status: "error",
        message: "Internal Server Error"
    });

    errorResponse.code(500);
    return errorResponse;
};

export const ErrorExtension = {
    name: "extension/error",
    version: "1.0.0",
    register: async (server: Server) => {
        server.ext("onPreResponse", handleResponse);
    }
};
