export class User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password?: string;
    role: string;
    photo?: string;
    created_at?: Date;
    updated_at?: Date;
    created_by?: string;
    updated_by?: string;
    is_deleted?: boolean;

    constructor(data: {
        id?: string;
        first_name: string;
        last_name: string;
        email: string;
        password: string;
        confirm_password?: string;
        role: string;
        photo?: string;
        created_at?: Date;
        updated_at?: Date;
        created_by?: string;
        updated_by?: string;
        is_deleted?: boolean;
    }) {
        this.id = data.id || "";
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.email = data.email;
        this.password = data.password;
        this.confirm_password = data.confirm_password;
        this.role = data.role;
        this.photo = data.photo;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.created_by = data.created_by;
        this.updated_by = data.updated_by;
        this.is_deleted = data.is_deleted || false;
    }
}
