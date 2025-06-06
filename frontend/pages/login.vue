<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ValidationErrors } from "~/models/error";
import { useAuth } from "~/composables/Auth/useAuth";

useHead({
    title: "Sign In - GiziLens Cloud",
    htmlAttrs: {
        lang: "en"
    }
});

const auth = useAuth();

const internalLinks = {
    home: "/",
    register: "/register"
};

const data = ref({
    formData: {
        email: "",
        password: ""
    },
    isLoading: false,
    isLoadingSubmit: false,
    showPassword: false,
    validationErrors: {} as ValidationErrors,
    generalError: "",
    successMessage: "",
    showAlert: false,
    text: {
        loginTitle: "Log in to your account",
        noAccount: "Don't have an account?",
        register: "Register",
        emailLabel: "Email",
        passwordLabel: "Password",
        signInButton: "Sign in",
        signing: "Signing in...",
        orContinueWith: "Or continue with"
    }
});

onMounted(async () => {
    await refreshToken();
});

const refreshToken = async () => {
    try {
        data.value.isLoading = true;
        const result = await auth.refreshToken();

        if (result.success) {
            navigateTo("/dashboards");
        } else if (result.error) {
            data.value.generalError = result.error;
            setTimeout(() => {
                navigateTo("/login");
            }, 2000);
        }
    } finally {
        data.value.isLoading = false;
    }
};

const signInButton = async () => {
    try {
        data.value.validationErrors = {};
        data.value.generalError = "";
        data.value.successMessage = "";
        data.value.showAlert = false;
        data.value.isLoadingSubmit = true;

        const result = await auth.loginUser(data.value.formData);

        if (!result.success) {
            if (result.validationErrors) {
                data.value.validationErrors = result.validationErrors;
                return;
            }

            if (result.message) {
                data.value.generalError = result.message;
                return;
            }

            if (result.error) {
                data.value.generalError = result.error;
                return;
            }
        } else {
            navigateTo("/dashboards");
        }
    } finally {
        data.value.isLoadingSubmit = false;
    }
};
</script>

<template>
    <section
        class="w-full min-h-screen bg-gradient-to-r from-primary-100 to-white sm:px-4 flex justify-center"
    >
        <div class="w-full space-y-6 text-gray-600 sm:max-w-md mb-8">
            <div class="text-center">
                <NuxtLink :to="internalLinks.home" aria-label="Go to homepage">
                    <template v-if="data.isLoading">
                        <div
                            class="w-[150px] h-[40px] bg-gray-200 rounded animate-pulse mx-auto"
                        ></div>
                    </template>
                    <template v-else>
                        <NuxtImg
                            src="https://storage.googleapis.com/iotunnel-storage/smtp/favicon.ico"
                            width="150"
                            class="mx-auto"
                            alt="Company Logo"
                        />
                    </template>
                </NuxtLink>
                <div class="space-y-2">
                    <template v-if="data.isLoading">
                        <div class="h-8 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
                        <div class="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
                    </template>
                    <template v-else>
                        <h1 class="text-gray-800 text-2xl font-bold sm:text-3xl">
                            {{ data.text.loginTitle }}
                        </h1>
                        <p class="">
                            {{ data.text.noAccount }}
                            <NuxtLink
                                :to="internalLinks.register"
                                class="font-medium text-primary-500 hover:text-primary-400"
                            >
                                {{ data.text.register }}
                            </NuxtLink>
                        </p>
                    </template>
                </div>
            </div>
            <div class="bg-white shadow p-4 py-4 sm:p-6 sm:rounded-lg">
                <form class="space-y-5">
                    <template v-if="data.isLoading">
                        <div class="space-y-5">
                            <div>
                                <div class="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                <div
                                    class="h-10 bg-gray-200 rounded w-full mt-2 animate-pulse"
                                ></div>
                            </div>
                            <div>
                                <div class="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                <div
                                    class="h-10 bg-gray-200 rounded w-full mt-2 animate-pulse"
                                ></div>
                            </div>
                            <div class="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                        </div>
                    </template>
                    <template v-else>
                        <div>
                            <label for="email" class="font-medium">{{
                                data.text.emailLabel
                            }}</label>
                            <input
                                id="email"
                                type="email"
                                v-model="data.formData.email"
                                :class="`w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border ${
                                    data.validationErrors.email
                                        ? 'border-red-500'
                                        : 'focus:border-primary-600'
                                } shadow-sm rounded-lg`"
                            />
                            <p v-if="data.validationErrors.email" class="mt-1 text-sm text-red-500">
                                {{ data.validationErrors.email }}
                            </p>
                        </div>
                        <div>
                            <label for="password" class="font-medium">{{
                                data.text.passwordLabel
                            }}</label>
                            <div class="relative">
                                <input
                                    id="password"
                                    :type="data.showPassword ? 'text' : 'password'"
                                    v-model="data.formData.password"
                                    autocomplete="current-password"
                                    :class="`w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border ${
                                        data.validationErrors.password
                                            ? 'border-red-500'
                                            : 'focus:border-primary-600'
                                    } shadow-sm rounded-lg`"
                                />
                                <button
                                    type="button"
                                    class="absolute right-3 top-[60%] transform -translate-y-1/2 text-gray-500"
                                    @click="data.showPassword = !data.showPassword"
                                >
                                    <svg
                                        v-if="!data.showPassword"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="w-5 h-5"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                        />
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <svg
                                        v-else
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="1.5"
                                        stroke="currentColor"
                                        class="w-5 h-5"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <p
                                v-if="data.validationErrors.password"
                                class="mt-1 text-sm text-red-500"
                            >
                                {{ data.validationErrors.password }}
                            </p>
                        </div>
                        <button
                            type="submit"
                            :disabled="data.isLoadingSubmit"
                            @click.prevent="signInButton"
                            class="w-full px-4 py-2 text-white font-medium bg-primary-600 hover:bg-primary-500 active:bg-primary-600 rounded-lg duration-150 flex items-center justify-center"
                        >
                            <span v-if="!data.isLoadingSubmit">{{ data.text.signInButton }}</span>
                            <span v-else class="flex items-center">
                                <svg
                                    class="animate-spin h-5 w-5 mr-3 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    ></circle>
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                {{ data.text.signing }}
                            </span>
                        </button>
                    </template>
                </form>
            </div>
        </div>
    </section>
</template>
