<script setup lang="ts">
defineProps<{ class?: string; variant?: "danger"; disabled?: boolean }>();
</script>

<template>
  <button
    :class="
      cn(
        'px-6 py-2 flex items-center justify-between gap-2 my-2 w-full hover:bg-emphasis rounded transition group disabled:opacity-50 disabled:cursor-not-allowed',
        $props.class,
        $props.variant === 'danger' ? 'text-red-500' : '',
      )
    "
    :disabled="disabled || false"
  >
    <div class="flex items-center gap-2">
      <slot name="icon" />
      <p class="opacity-75 group-hover:opacity-100 transition">
        <slot name="default" />
      </p>
    </div>
    <i
      v-if="$props.variant !== 'danger'"
      class="pi pi-chevron-right opacity-75 group-hover:opacity-100 transition text-xs"
    />
  </button>
</template>
