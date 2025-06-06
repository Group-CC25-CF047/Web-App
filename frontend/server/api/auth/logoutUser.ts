import axios from "axios";
import { defineEventHandler, readBody } from "h3";
import type { ApiResponse } from "~/models/response";
import { log, logLevel } from "~/utils/logging";

export default defineEventHandler(async event => {
    try {
        const config = useRuntimeConfig();
        const body = await readBody(event);
        const cookies = event.node.req.headers.cookie;

        const response = await axios.delete<ApiResponse>(
            `${config.apiUrl}/users/logout/${body.sessionId}`,
            {
                headers: {
                    authorization: `Bearer ${body.token}`,
                    Cookie: cookies
                }
            }
        );

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
            log(logLevel.ERROR, `Unexpected error in logoutUser: ${error}`);
            throw new Error("An unexpected error occurred");
        }
    }
});
