const isProd = process.env.NODE_ENV === "production";

const GetEnvValue = <T>(prodValue: T, devValue: T): T => {
    return isProd ? prodValue : devValue;
};

export const Config = {
    environment: process.env.NODE_ENV || "development",
    server: {
        port: process.env.PORT_BACKEND || 3000,
        host: process.env.HOST_BACKEND || "localhost"
    },
    cookie: {
        isSecure: GetEnvValue(true, false),
        isHttpOnly: GetEnvValue(true, false),
        domain: GetEnvValue(process.env.COOKIE_DOMAIN, "localhost"),
        isSameSite: GetEnvValue(process.env.COOKIE_SAMESITE, "None") as "Strict" | "Lax" | "None"
    },
    cors: {
        origin: GetEnvValue([`https://*.${process.env.COOKIE_DOMAIN || "localhost"}`], ["*"])
    },
    key: {
        apiKey: process.env.API_KEY || "apikey",
        accessJwtKey: process.env.ACCESS_JWT_KEY || "jwtkey",
        refreshJwtKey: process.env.REFRESH_JWT_KEY || "jwtkey2",
        cookieKey: process.env.COOKIE_KEY || "12345678901234567890123456789012"
    },
    database: {
        user: GetEnvValue(process.env.POSTGRES_USER_PROD, process.env.POSTGRES_USER_DEV),
        host: GetEnvValue(process.env.POSTGRES_HOST_PROD, process.env.POSTGRES_HOST_DEV),
        database: GetEnvValue(process.env.POSTGRES_DB_PROD, process.env.POSTGRES_DB_DEV),
        password: GetEnvValue(
            process.env.POSTGRES_PASSWORD_PROD,
            process.env.POSTGRES_PASSWORD_DEV
        ),
        port: GetEnvValue(
            parseInt(process.env.POSTGRES_PORT_PROD!, 10),
            parseInt(process.env.POSTGRES_PORT_DEV!, 10)
        )
    },
    redis: {
        host: GetEnvValue(process.env.REDIS_HOST_PROD, process.env.REDIS_HOST_DEV),
        port: GetEnvValue(
            parseInt(process.env.REDIS_PORT_PROD!, 10),
            parseInt(process.env.REDIS_PORT_DEV!, 10)
        ),
        password: GetEnvValue(process.env.REDIS_PASSWORD_PROD, process.env.REDIS_PASSWORD_DEV)
    },
    ttl: {
        session: 30 * 24 * 60 * 60,
        jwt: 1 * 24 * 60 * 60,
        otp: 5 * 60,
        cache: 1 * 60 * 60
    },
    logging: {
        level: process.env.LOG_LEVEL || "INFO"
    },
    storage: {
        defaultPhoto: process.env.STORAGE_DEFAULT_PHOTO
    }
};
