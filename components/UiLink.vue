<script setup lang="ts">
import cn from "~/utils/cn"
</script>

<template>
  <NuxtLink v-bind="$props" :class="cn('link-primary font-medium text-primary hover:text-primary-emphasis', $props.class as string)">
    <slot />
  </NuxtLink>
</template>
