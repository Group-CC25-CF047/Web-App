import { defineStore } from "pinia";

interface AuthState {
    token: string | null;
}

export const useAuthStore = defineStore("auth", {
    state: (): AuthState => ({
        token: null
    }),

    actions: {
        setToken(token: string) {
            this.token = token;
        },
        clearToken() {
            this.token = null;
        }
    },

    getters: {
        getToken: (state): string | null => state.token
    }
});
