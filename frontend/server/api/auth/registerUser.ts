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
            `${config.apiUrl}/users/client`,
            {
                first_name: body.first_name,
                last_name: body.last_name,
                password: body.password,
                confirm_password: body.confirm_password,
                email: body.email,
            },
            {
                headers: {
                    "x-api-key": config.apiKey
                }
            }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.data.message === "Invalid Validation") {
                return error.response?.data as ValidationError;
            }
            return error.response?.data;
        } else {
            log(logLevel.ERROR, `Unexpected error in refreshToken: ${error}`);
            throw new Error("An unexpected error occurred");
        }
    }
});
