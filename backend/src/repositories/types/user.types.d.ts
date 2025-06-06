export type TUserPreview = Pick<IUser, "id" | "first_name" | "last_name">;
export type TUserPassword = Pick<IUser, "id" | "password">;
export type TUserLogin = Pick<IUser, "email" | "password">;
export type TUserPasswordUpdate = Pick<
    IUser,
    "email" | "password" | "confirm_password" | "otp_code"
>;
export type TUserUpdate = Pick<
    IUser,
    "id" | "first_name" | "last_name" | "password" | "email" | "role"
>;
