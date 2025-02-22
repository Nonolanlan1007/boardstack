<script setup lang="ts">
defineProps<{ icon: string; class?: string }>();
</script>

<template>
  <button :class="cn('p-2', $props.class)">
    <i :class="icon" class="dark:text-white text-black" />
  </button>
</template>
