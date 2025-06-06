import axios from "axios";
import { defineEventHandler, readBody } from "h3";
import type { ApiResponse } from "~/models/response";
import { log, logLevel } from "~/utils/logging";

export default defineEventHandler(async event => {
    try {
        const config = useRuntimeConfig();
        const body = await readBody(event);
        const { token } = body;
        const cookies = event.node.req.headers.cookie;

        const response = await axios.get<ApiResponse>(`${config.apiUrl}/users`, {
            headers: {
                authorization: `Bearer ${token}`,
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
            log(logLevel.ERROR, `Unexpected error in getUser: ${error}`);
            throw new Error("An unexpected error occurred");
        }
    }
});
