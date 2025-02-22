<script setup lang="ts">
import animation from "~/assets/lotties/home_github_card.json";
</script>

<template>
  <Card class="flex-[2] min-w-80 h-80 relative overflow-clip group">
    <template #title>
      <h3 class="text-center text-xl font-semibold">Made for developers</h3>
      <p class="text-sm text-center text-balance">
        Organize your coding projects with our GitHub integration
      </p>
    </template>

    <template #content>
      <span
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 group-hover:h-48 group-hover:w-48 rounded-full bg-primary blur-3xl transition-all duration-200"
      />
      <ClientLottie :animation-data="animation" class="max-h-64" />
    </template>
  </Card>
</template>
