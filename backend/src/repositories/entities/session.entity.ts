// filepath: /home/ubuntu/Documents/GiziLens/backend/src/repositories/entities/session.entity.ts
export class Session {
    id: string;
    user_id: string;
    token: string;
    user_agent?: string;
    expires_at: Date;
    created_at?: Date;
    updated_at?: Date;

    constructor(data: {
        id?: string;
        user_id: string;
        token: string;
        user_agent?: string;
        expires_at: Date;
        created_at?: Date;
        updated_at?: Date;
    }) {
        this.id = data.id || "";
        this.user_id = data.user_id;
        this.token = data.token;
        this.user_agent = data.user_agent;
        this.expires_at = data.expires_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}
