<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const props = defineProps({
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: "success",
        validator: (value: string) => ["success", "danger", "warning", "info"].includes(value)
    }
});

const emit = defineEmits(["dismiss"]);
const isVisible = ref(true);
const timeout = ref(5000);
const isExiting = ref(false);

const sanitizedMessage = computed(() => {
    const strangeSymbolsPattern = /[<>?~`{}[\]|\\^]/;

    if (strangeSymbolsPattern.test(props.message)) {
        return "An unexpected error occurred. Please try again.";
    }

    return props.message;
});

const onDismiss = () => {
    isExiting.value = true;
    setTimeout(() => {
        isVisible.value = false;
        emit("dismiss");
    }, 300); 
};

onMounted(() => {
    setTimeout(() => {
        if (isVisible.value) {
            onDismiss();
        }
    }, timeout.value);
});

const toastStyle = computed(() => {
    switch (props.type) {
        case "success":
            return "text-green-600";
        case "danger":
            return "text-red-600";
        case "warning":
            return "text-yellow-600";
        case "info":
            return "text-blue-600";
        default:
            return "";
    }
});

const iconClass = computed(() => {
    switch (props.type) {
        case "success":
            return "bg-green-100 text-green-600";
        case "danger":
            return "bg-red-100 text-red-600";
        case "warning":
            return "bg-yellow-100 text-yellow-600";
        case "info":
            return "bg-blue-100 text-blue-600";
        default:
            return "";
    }
});
</script>

<template>
    <div
        v-if="isVisible"
        class="fixed z-50 flex items-center w-full max-w-sm p-4 text-gray-500 bg-white rounded-xl shadow-2xl top-6 left-1/2 -translate-x-1/2 border border-gray-100"
        :class="[toastStyle, isExiting ? 'animate-toast-exit' : 'animate-toast-enter']"
        role="alert"
    >
        <div
            :class="[
                'inline-flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl',
                iconClass
            ]"
        >
            <template v-if="type === 'success'">
                <svg
                    class="w-6 h-6 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                    />
                </svg>
            </template>
            <template v-else-if="type === 'danger'">
                <svg
                    class="w-6 h-6 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                    />
                </svg>
            </template>
            <template v-else-if="type === 'warning'">
                <svg
                    class="w-6 h-6 text-yellow-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
            </template>
            <template v-else-if="type === 'info'">
                <svg
                    class="w-6 h-6 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                    />
                </svg>
            </template>
        </div>
        <div class="ms-4 text-sm font-normal">
            {{ sanitizedMessage }}
        </div>
        <button
            type="button"
            class="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 transition-all duration-200 ease-in-out"
            @click="onDismiss"
            aria-label="Close"
        >
            <span class="sr-only">Close</span>
            <svg
                class="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
            >
                <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
            </svg>
        </button>
    </div>
</template>

<style scoped>
.animate-toast-enter {
    animation: slideIn 0.3s ease-out forwards, fadeIn 0.3s ease-out forwards;
}

.animate-toast-exit {
    animation: slideOut 0.3s ease-in forwards, fadeOut 0.3s ease-in forwards;
}

@keyframes slideIn {
    from {
        transform: translate(-50%, -100%);
    }
    to {
        transform: translate(-50%, 0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translate(-50%, 0);
    }
    to {
        transform: translate(-50%, -100%);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}
</style>
