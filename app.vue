<script setup lang="ts">
useSeoMeta({
  title:
    "BoardStack - Open-source software to manage your project, organize your tasks, note your ideas and much more!",
  ogTitle:
    "BoardStack - Open-source software to manage your project, organize your tasks, note your ideas and much more!",
  description:
    "BoardStack lets you create customized boards to organize your projects and collaborate easily, all in a simple and simple and flexible.",
  twitterCard: "summary_large_image",
  ogImage: "/banner.png",
  ogImageAlt: "BoardStack Banner",
  colorScheme: "dark light",
  author: "https://nolhan.dev",
  creator: "BoardStack",
  ogUrl: "https://boardstack.app",
  ogType: "website",
  ogLocale: "en-US",
  ogSiteName: "BoardStack",
  applicationName: "BoardStack",
  appleMobileWebAppTitle: "BoardStack",
});

useColorMode();
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <Toast />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.1s ease;
}

.slide-right-enter-from {
  transform: translateX(100%);
}

.slide-right-enter-to,
.slide-right-leave-from {
  transform: translateX(0);
}

.slide-right-leave-to {
  transform: translateX(-100%);
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.1s ease;
}

.slide-left-enter-from {
  transform: translateX(-100%);
}

.slide-left-enter-to,
.slide-left-leave-from {
  transform: translateX(0);
}

.slide-left-leave-to {
  transform: translateX(100%);
}
</style>
