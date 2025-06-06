import type { ErrorWithMessage } from "~/models/error";
import type { UserApiResponse } from "~/models/user";
import { showToast } from "~/plugins/toast";
import { useAuthStore } from "~/stores/pinia";
import { useAuth } from "../Auth/useAuth";

export const useUser = () => {
    const auth = useAuth();

    const fetchUser = async (retryCount = 0) => {
        try {
            const MAX_RETRIES = 2;
            const authStore = useAuthStore();
            const response = await $fetch<UserApiResponse>("/api/user/getUser", {
                method: "POST",
                body: {
                    token: authStore.token
                },
                credentials: "include" // Include cookies in the request
            });

            if (response.message === "Unauthorized." && retryCount < MAX_RETRIES) {
                await auth.refreshToken();
                return await fetchUser(retryCount + 1);
            }

            if ("data" in response && response.data && response.data.user) {
                const userData = response.data.user;
                return {
                    success: true,
                    loading: false,
                    user: {
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        photo:
                            userData.photo ||
                            "https://storage.googleapis.com/iotunnel-storage/default.jpg"
                    }
                };
            }

            return {
                success: false,
                loading: false
            };
        } catch (error: unknown) {
            const err = error as Partial<ErrorWithMessage>;
            const errorMessage = err.message ?? "An unexpected error occurred. Please try again.";
            showToast(errorMessage, "danger");
            localStorage.removeItem("session_id");

            return {
                success: false,
                loading: false,
                error: errorMessage
            };
        }
    };

    return {
        fetchUser
    };
};
