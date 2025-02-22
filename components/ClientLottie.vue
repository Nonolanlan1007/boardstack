<script setup lang="ts">
import { Vue3Lottie } from "vue3-lottie";
</script>

<template>
  <ClientOnly>
    <Vue3Lottie v-bind="$attrs" v-on="$attrs" />
  </ClientOnly>
</template>
