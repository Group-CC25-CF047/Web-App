import type { SuccessResponse } from "./response";

export interface User {
    first_name: string;
    last_name: string;
    photo: string;
}

export interface UserResponse {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    photo: string;
}

export interface UserApiResponse extends SuccessResponse {
    data: {
        user: UserResponse;
    };
}
