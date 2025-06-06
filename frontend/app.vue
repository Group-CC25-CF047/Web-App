<script setup>
const router = useRouter();

useHead({
    link: [{ rel: "manifest", href: "/manifest.json" }],
    meta: [{ name: "theme-color", content: "#06b6d4" }]
});

onMounted(async () => {
    if (router) {
        router.beforeEach((to, from, next) => {
            next();
        });
    }
});
</script>

<template>
    <div>
        <NuxtPage />
    </div>
</template>
