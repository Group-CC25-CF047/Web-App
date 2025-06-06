<script setup lang="ts">
useHead({
    title: "GiziLens Cloud",
    htmlAttrs: {
        lang: "en"
    }
});

// Define login function
const navigateToLogin = () => {
    navigateTo("/login");
};

if (process.client) {
    const hostname = window.location.hostname;
    const urlObj = new URL(window.location.href);
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hostParts = hostname.split(".");

    if (hostParts.length > 2) {
        const sessionId = localStorage.getItem("session_id");

        const domain = hostParts.slice(1).join(".");
        const newUrl = `${urlObj.protocol}//${domain}${pathname}${search}`;

        if (sessionId) {
            document.cookie = `temp_session_id=${sessionId}; path=/; max-age=60`;
        }

        window.location.href = newUrl;
    } else {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                const part = parts.pop()?.split(";").shift();
                return part;
            }
            return null;
        };

        const tempSessionId = getCookie("temp_session_id");
        if (tempSessionId && !localStorage.getItem("session_id")) {
            localStorage.setItem("session_id", tempSessionId);
            document.cookie = "temp_session_id=; path=/; max-age=0";
        }
    }
}
</script>

<template>
    <div>
        <div class="flex flex-col h-screen">
            <div class="flex-1 overflow-auto p-4">
                <h1 class="text-2xl font-bold">Welcome to GiziLens</h1>

                <!-- Login button -->
                <div class="mt-6">
                    <button
                        @click="navigateToLogin"
                        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
:deep(.mobile-bar) {
    display: none !important;
}
</style>
