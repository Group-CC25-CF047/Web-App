import axios from "axios";
import { defineEventHandler, readBody } from "h3";
import type { ApiResponse } from "~/models/response";
import { log, logLevel } from "~/utils/logging";

export default defineEventHandler(async event => {
    try {
        const config = useRuntimeConfig();
        const body = await readBody(event);
        const idSessionClient = body.idSessionClient;
        const cookies = event.node.req.headers.cookie;

        if (!cookies) {
            return {
                status: "fail",
                message: "No session found."
            };
        }

        const response = await axios.get<ApiResponse>(`${config.apiUrl}/auths/${idSessionClient}`, {
            headers: {
                "x-api-key": config.apiKey,
                Cookie: cookies
            },
            withCredentials: true
        });

        // Forward any cookies from the API response
        const setCookie = response.headers["set-cookie"];
        if (setCookie) {
            setCookie.forEach(cookie => {
                appendHeader(event, "Set-Cookie", cookie);
            });
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return error.response?.data;
        } else {
            log(logLevel.ERROR, `Unexpected error in refreshToken: ${error}`);
            throw new Error("An unexpected error occurred");
        }
    }
});
