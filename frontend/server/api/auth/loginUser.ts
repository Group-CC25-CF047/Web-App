import axios from "axios";
import { defineEventHandler, readBody } from "h3";
import type { ValidationError } from "~/models/error";
import type { ApiResponse } from "~/models/response";
import { log, logLevel } from "~/utils/logging";

export default defineEventHandler(async event => {
    try {
        const config = useRuntimeConfig();
        const body = await readBody(event);
        const response = await axios.post<ApiResponse>(
            `${config.apiUrl}/users/login`,
            {
                email: body.email,
                password: body.password
            },
            {
                headers: {
                    "x-api-key": config.apiKey
                },
                withCredentials: true
            }
        );

        const cookies = response.headers["set-cookie"];
        if (cookies) {
            cookies.forEach(cookie => {
                appendHeader(event, "Set-Cookie", cookie);
            });
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.data.message === "Invalid Validation") {
                return error.response?.data as ValidationError;
            }
            return error.response?.data;
        } else {
            log(logLevel.ERROR, `Unexpected error in loginUser: ${error}`);
            throw new Error("An unexpected error occurred");
        }
    }
});
