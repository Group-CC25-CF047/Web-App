export interface IUser {
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
}

export interface IUserWithOTP extends IUser {
    otp_code: number;
}

export interface IUserUpdate {
    id: string;
    first_name: string;
    last_name: string;
    password: string;
    email: string;
    role: string;
}

export interface IUserPreview {
    id: string;
    first_name: string;
    last_name: string;
}

export interface IUserPassword {
    id: string;
    password: string;
}

export interface IUserLogin {
    email: string;
    password: string;
}

export interface IUserPasswordUpdate {
    email: string;
    password: string;
    confirm_password?: string;
    otp_code: number;
}

export interface IUserUpdate {
    id: string;
    first_name: string;
    last_name: string;
    password: string;
    email: string;
    phone_number: string;
    role: string;
}