// https://nuxt.com/docs/api/configuration/nuxt-config
// nuxt.config.ts
import { defineNuxtConfig } from "nuxt/config";

// Add manifestRouteRules to ExperimentalOptions
interface ExtendedExperimentalOptions {
    manifestRouteRules?: {
        override?: boolean;
    };
}

declare module "nuxt/schema" {
    interface NitroConfig {
        preset?: string;
        routeRules?: Record<string, string | number | boolean | object>;
        listen?: {
            host?: string;
            port?: number;
        };
    }

    interface NuxtConfig {
        server?: {
            port?: number;
            host?: string;
        };
        experimental?: ExtendedExperimentalOptions & Record<string, object>;
        pwa?: string | boolean | object;
    }
}

export default defineNuxtConfig({
    compatibilityDate: "2024-11-01",
    devtools: { enabled: true },
    ssr: false,

    app: {
        baseURL: "/",
        buildAssetsDir: "/assets/",
        head: {
            meta: [{ name: "theme-color", content: "#4f46e5" }],
            link: [{ rel: "icon", type: "image/png", href: "/logo.png" }]
        }
    },

    runtimeConfig: {
        apiKey: process.env.NUXT_API_KEY,
        apiUrl: process.env.NUXT_API_URL,
        public: {
            apiBase: "/api",
            baseUrl: process.env.BASE_URL || ""
        }
    },

    server: {
        port: process.env.NITRO_PORT ? parseInt(process.env.NITRO_PORT) : 3000,
        host: process.env.NITRO_HOST || "0.0.0.0"
    },

    nitro: {
        preset: "bun"
    },

    experimental: {
        manifestRouteRules: {
            override: true
        }
    },

    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {}
        }
    },

    modules: ["@nuxt/image", "@pinia/nuxt", "@vite-pwa/nuxt", "@nuxtjs/tailwindcss"],

    pwa: {
        registerType: "autoUpdate",
        injectRegister: "auto",
        registerWebManifestInRouteRules: true,
        strategies: "generateSW",
        includeAssets: ["favicon.ico", "logo.png"],
        manifest: {
            name: "GiziLens - Food Nutrition Analysis Platform",
            short_name: "GiziLens",
            theme_color: "#06b6d4",
            background_color: "#ffffff",
            display: "standalone",
            orientation: "portrait",
            scope: "/",
            start_url: "/login",
            icons: [
                {
                    src: "/favicon.ico",
                    sizes: "64x64",
                    type: "image/x-icon"
                }
            ],
            description:
                "A food nutrition analysis platform that helps you track and analyze your nutritional intake",
            categories: ["health", "nutrition", "food"]
        },
        workbox: {
            navigateFallback: null,
            globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
            cleanupOutdatedCaches: true,
            runtimeCaching: [
                {
                    urlPattern: /^https:\/\/app\.farismunir\.my\.id\/*/,
                    handler: "NetworkFirst",
                    options: {
                        cacheName: "api-cache",
                        expiration: {
                            maxEntries: 100,
                            maxAgeSeconds: 60 * 60 * 24
                        }
                    }
                }
            ]
        },
        client: {
            installPrompt: true
        },
        devOptions: {
            enabled: true,
            type: "module",
            navigateFallbackAllowlist: [/^\/$/]
        }
    }
});
