export interface IJwtPayload {
    id: string;
    role: string;
}

export interface IJwtDecoded {
    decoded: {
        payload: IJwtPayload;
    };
}

export interface IToken {
    access_token: string;
    refresh_token: string;
    role?: string;
    user_id: string;
    user_agent?: string;
}
