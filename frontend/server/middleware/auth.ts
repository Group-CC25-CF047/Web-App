import { defineEventHandler, getRequestURL, parseCookies, sendRedirect } from "h3";

export default defineEventHandler(async event => {
    if (event.path.startsWith("/api/")) {
        return;
    }

    const publicRoutes = ["/login", "/register", "/reset"];
    const url = getRequestURL(event);
    const path = url.pathname;

    if (publicRoutes.includes(path)) {
        return;
    }

    const cookies = parseCookies(event);
    const sessionId = cookies.session_id;

    if (!sessionId) {
        return sendRedirect(event, "/login");
    }

    try {
        const valid = await verifySession(sessionId);

        if (!valid) {
            return sendRedirect(event, "/login");
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return sendRedirect(event, "/login");
    }
});

async function verifySession(sessionId: string) {
    return Boolean(sessionId);
}
