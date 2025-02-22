<script setup lang="ts">
definePageMeta({
  middleware: "auth-only",
  layout: "app",
});
</script>

<template>
  <h1>Welcome to /app</h1>
</template>
