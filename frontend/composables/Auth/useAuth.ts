import type { ValidationErrors, ErrorWithMessage } from "~/models/error";
import type { ApiResponse } from "~/models/response";
import { showToast } from "~/plugins/toast";
import { useAuthStore } from "~/stores/pinia";

export const useAuth = () => {
    const refreshToken = async (currentPath?: string) => {
        try {
            const sessionId = localStorage.getItem("session_id");
            const response = await $fetch<ApiResponse>("/api/auth/refreshToken", {
                method: "POST",
                body: { idSessionClient: sessionId },
                credentials: "include" // Include cookies in the request
            });

            const isSuccess = "status" in response && response.status === "success";
            if (!isSuccess) {
                localStorage.removeItem("session_id");
                const path = currentPath || useRoute().path;
                if (path !== "/login") {
                    navigateTo("/login");
                }
                return {
                    success: false,
                    loading: false
                };
            }

            if (response.message === "Session expired." && response.status === "fail") {
                localStorage.removeItem("session_id");
            }

            if ("data" in response && response.data) {
                const authStore = useAuthStore();
                authStore.setToken(response.data.access_token as string);
                return {
                    success: true,
                    loading: false,
                    data: response.data
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
            await logoutUser();

            return {
                success: false,
                loading: false,
                error: errorMessage
            };
        }
    };

    const loginUser = async (formData: { email: string; password: string }) => {
        try {
            const response = await $fetch<ApiResponse>("/api/auth/loginUser", {
                method: "POST",
                body: formData,
                credentials: "include" // Include cookies in the request
            });

            const isFail = "status" in response && response.status === "fail";
            const isSuccess = "status" in response && response.status === "success";

            if (isFail && response.message === "Invalid Validation" && "details" in response) {
                const validationErrors: ValidationErrors = {};
                response.details.forEach((detail: { field: string; message: string }) => {
                    validationErrors[detail.field] = detail.message;
                });

                return {
                    success: false,
                    validationErrors,
                    loading: false
                };
            }

            if (!isSuccess) {
                showToast(response.message, "danger");
                return {
                    success: false,
                    message: response.message,
                    loading: false
                };
            }

            if ("data" in response && response.data) {
                localStorage.setItem("session_id", response.data.session_id as string);
                const authStore = useAuthStore();
                authStore.setToken(response.data.access_token as string);

                return {
                    success: true,
                    loading: false,
                    data: response.data
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

            return {
                success: false,
                loading: false,
                error: errorMessage
            };
        }
    };

    const registerUser = async (formData: {
        first_name: string;
        last_name: string;
        email: string;
        password: string;
        confirm_password: string;
    }) => {
        try {
            const response = await $fetch<ApiResponse>("/api/auth/registerUser", {
                method: "POST",
                body: formData,
                credentials: "include" // Include cookies in the request
            });

            const isFail = "status" in response && response.status === "fail";
            const isSuccess = "status" in response && response.status === "success";

            if (isFail && response.message === "Invalid Validation" && "details" in response) {
                const validationErrors: ValidationErrors = {};
                response.details.forEach((detail: { field: string; message: string }) => {
                    validationErrors[detail.field] = detail.message;
                });

                return {
                    success: false,
                    validationErrors,
                    loading: false
                };
            }

            if (!isSuccess) {
                showToast(response.message, "danger");
                return {
                    success: false,
                    message: response.message,
                    loading: false
                };
            }

            if ("data" in response && response.data) {
                showToast(response.message, "success");
                return {
                    success: true,
                    message: response.message,
                    loading: false,
                    data: response.data
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

            return {
                success: false,
                loading: false,
                error: errorMessage
            };
        }
    };

    const logoutUser = async () => {
        try {
            const sessionId = localStorage.getItem("session_id");
            const authStore = useAuthStore();

            const response = await $fetch<ApiResponse>("/api/auth/logoutUser", {
                method: "POST",
                body: {
                    token: authStore.token,
                    sessionId: sessionId
                }
            });

            const isSuccess = "status" in response && response.status === "success";
            if (!isSuccess) {
                const message = response.message || "Logout failed";
                showToast(message, "danger");
            }

            localStorage.removeItem("session_id");
            authStore.clearToken();

            return {
                success: true
            };
        } catch (error: unknown) {
            const err = error as Partial<ErrorWithMessage>;
            const errorMessage = err.message ?? "An unexpected error occurred. Please try again.";
            showToast(errorMessage, "danger");
            localStorage.removeItem("session_id");

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    return {
        refreshToken,
        loginUser,
        registerUser,
        logoutUser
    };
};
