<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUser } from "~/composables/User/useUser";
import { useAuth } from "~/composables/Auth/useAuth";
import { showToast } from "~/plugins/toast";
import type { User } from "~/models/user";

// Define interface for the API response structure we use in this component
interface DashboardUserResponse {
    success: boolean;
    loading: boolean;
    user: User | null;
    error: string | null;
}

const { fetchUser } = useUser();
const { logoutUser, refreshToken } = useAuth();
const isLoading = ref(true);
const isLoggingOut = ref(false);
const isRefreshingToken = ref(false);
const userData = ref<DashboardUserResponse>({
    success: false,
    loading: true,
    user: null,
    error: null
});

const loadUserData = async () => {
    isLoading.value = true;
    try {
        const result = await fetchUser();
        userData.value = result as unknown as DashboardUserResponse;
    } catch (error: unknown) {
        userData.value = {
            success: false,
            loading: false,
            user: null,
            error: (error as { message: string })?.message || "Failed to load user data"
        };
    } finally {
        isLoading.value = false;
    }
};

const handleRefreshToken = async () => {
    try {
        isRefreshingToken.value = true;
        const result = await refreshToken();
        if (result.success) {
            showToast("Token refreshed successfully", "success");
            await loadUserData();
        }
    } catch (error) {
        console.error("Token refresh failed:", error);
    } finally {
        isRefreshingToken.value = false;
    }
};

const handleLogout = async () => {
    try {
        isLoggingOut.value = true;
        const result = await logoutUser();
        if (result.success) {
            navigateTo("/login");
        }
    } catch (error) {
        console.error("Logout failed:", error);
    } finally {
        isLoggingOut.value = false;
    }
};

onMounted(() => {
    loadUserData();
});
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <!-- Header -->
        <header class="bg-white shadow">
            <div
                class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center"
            >
                <h1 class="text-2xl font-bold text-gray-900">GiziLens Dashboard</h1>
                <div class="flex items-center gap-4" v-if="userData.user">
                    <button
                        @click="handleRefreshToken"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-150 flex items-center mr-3"
                        :disabled="isRefreshingToken"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        {{ isRefreshingToken ? "Refreshing..." : "Refresh Token" }}
                    </button>
                    <button
                        @click="handleLogout"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-150 flex items-center mr-3"
                        :disabled="isLoggingOut"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        {{ isLoggingOut ? "Logging out..." : "Logout" }}
                    </button>
                    <div class="text-right mr-2">
                        <p class="text-sm font-medium text-gray-900">
                            {{ userData.user.first_name }} {{ userData.user.last_name }}
                        </p>
                        <p class="text-xs text-gray-500">Member</p>
                    </div>
                    <img
                        :src="userData.user.photo"
                        alt="User profile"
                        class="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                    />
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div v-if="isLoading" class="flex justify-center items-center h-64">
                <div
                    class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"
                ></div>
            </div>

            <div
                v-else-if="userData.success && userData.user"
                class="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <!-- User Profile Card -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="p-6">
                        <div class="flex justify-center mb-4">
                            <img
                                :src="userData.user.photo"
                                alt="User profile"
                                class="w-32 h-32 rounded-full object-cover border-4 border-emerald-500"
                            />
                        </div>
                        <h2 class="text-xl font-semibold text-center text-gray-900">
                            {{ userData.user.first_name }} {{ userData.user.last_name }}
                        </h2>
                        <div class="mt-6 border-t pt-4">
                            <div class="flex justify-between items-center py-2">
                                <span class="text-gray-500">Name</span>
                                <span class="font-medium"
                                    >{{ userData.user.first_name }}
                                    {{ userData.user.last_name }}</span
                                >
                            </div>
                            <div
                                class="flex justify-between items-center py-2 border-t border-gray-100"
                            >
                                <span class="text-gray-500">Account Status</span>
                                <span
                                    class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
                                    >Active</span
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-lg shadow md:col-span-2">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div class="border-t">
                            <div class="py-4 border-b border-gray-100 flex items-center">
                                <div class="bg-blue-100 p-2 rounded-full mr-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-blue-600"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">Profile Updated</p>
                                    <p class="text-xs text-gray-500">2 hours ago</p>
                                </div>
                            </div>
                            <div class="py-4 border-b border-gray-100 flex items-center">
                                <div class="bg-green-100 p-2 rounded-full mr-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-green-600"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">
                                        Successful Login
                                    </p>
                                    <p class="text-xs text-gray-500">Today at 9:30 AM</p>
                                </div>
                            </div>
                            <div class="py-4 flex items-center">
                                <div class="bg-purple-100 p-2 rounded-full mr-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5 text-purple-600"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">
                                        Dashboard Accessed
                                    </p>
                                    <p class="text-xs text-gray-500">Yesterday at 4:15 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                        <div class="space-y-4">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-sm text-gray-500">Logins this month</h4>
                                    <span class="text-lg font-semibold text-gray-900">12</span>
                                </div>
                                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        class="bg-blue-600 h-2 rounded-full"
                                        style="width: 60%"
                                    ></div>
                                </div>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-sm text-gray-500">Data Entries</h4>
                                    <span class="text-lg font-semibold text-gray-900">24</span>
                                </div>
                                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        class="bg-green-600 h-2 rounded-full"
                                        style="width: 80%"
                                    ></div>
                                </div>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-sm text-gray-500">Account Age</h4>
                                    <span class="text-lg font-semibold text-gray-900">45 days</span>
                                </div>
                                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        class="bg-purple-600 h-2 rounded-full"
                                        style="width: 30%"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow md:col-span-2">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                class="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex flex-col items-center transition duration-150"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6 text-blue-600 mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                <span class="text-xs font-medium">Edit Profile</span>
                            </button>

                            <button
                                class="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex flex-col items-center transition duration-150"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6 text-green-600 mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                                <span class="text-xs font-medium">New Entry</span>
                            </button>

                            <button
                                class="bg-amber-50 hover:bg-amber-100 p-4 rounded-lg flex flex-col items-center transition duration-150"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6 text-amber-600 mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span class="text-xs font-medium">Reports</span>
                            </button>

                            <button
                                class="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex flex-col items-center transition duration-150"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6 text-purple-600 mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span class="text-xs font-medium">Settings</span>
                            </button>

                            <button
                                @click="handleLogout"
                                class="bg-red-50 hover:bg-red-100 p-4 rounded-lg flex flex-col items-center transition duration-150"
                                :disabled="isLoggingOut"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-6 w-6 text-red-600 mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                <span class="text-xs font-medium">{{
                                    isLoggingOut ? "Logging out..." : "Logout"
                                }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error State -->
            <div v-else class="bg-white rounded-lg shadow p-6">
                <div class="flex flex-col items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-16 w-16 text-red-500 mb-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load user data</h3>
                    <p class="text-gray-500">
                        {{ userData.error || "Please try refreshing the page or log in again." }}
                    </p>
                    <button
                        @click="loadUserData"
                        class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-150"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-gray-200 mt-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <p class="text-center text-sm text-gray-500">
                    © 2025 GiziLens. All rights reserved.
                </p>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
