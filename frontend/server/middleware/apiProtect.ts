import { defineEventHandler, setHeader, getHeader, createError } from "h3";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async event => {
    if (!event.path.startsWith("/api/")) {
        return;
    }
    const config = useRuntimeConfig();
    const apiUrl = new URL(config.apiUrl || "");
    const baseDomain = apiUrl.hostname.replace(/^api\./, "");
    const allowedDomain = `https://app.${baseDomain}`;
    setHeader(event, "Access-Control-Allow-Origin", allowedDomain);
    setHeader(event, "Access-Control-Allow-Methods", "POST");
    setHeader(event, "Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (event.method === "OPTIONS") {
        return null;
    }
    
    if (config.public.environment !== 'production') {
        return;
    }
    
    const origin = getHeader(event, "origin");
    const userAgent = getHeader(event, "user-agent");
    const isValidOrigin =
        origin && (origin === allowedDomain || baseDomain.includes(new URL(origin).hostname));
    const isValidUserAgent = userAgent && userAgent.includes("Mozilla");
    if (!isValidOrigin || !isValidUserAgent) {
        throw createError({
            statusCode: 403,
            message: "Forbidden: Invalid Origin or User-Agent",
            data: { origin, userAgent }
        });
    }
});
