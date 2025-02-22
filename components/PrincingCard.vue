<script setup lang="ts">
interface PrincingCardItem {
  label: string;
  included: boolean;
}

defineProps<{
  title: string;
  description: string;
  price: number;
  items: PrincingCardItem[];
  isPerUser: boolean;
}>();
</script>

<template>
  <Card class="flex-1 h-fit">
    <template #title>
      <h2 class="font-semibold text-2xl mb-2">
        {{ title }}
      </h2>
      <p>
        {{ description }}
      </p>
    </template>
    <template #content>
      <div class="flex items-end gap-2">
        <span class="font-bold text-3xl">€{{ price }}</span>
        <span v-if="!isPerUser" class="font-medium opacity-75">per month</span>
        <span v-else class="font-medium opacity-75">per month per user</span>
      </div>
      <Divider class="my-4" />
      <ul class="list-none flex flex-col gap-4 flex-1">
        <li
          v-for="item in items"
          :key="item.label"
          class="flex items-center gap-2"
        >
          <i v-if="item.included" class="pi pi-check text-green-500 text-lg" />
          <i v-else class="pi pi-times text-red-500 text-lg" />
          <span class="leading-6">
            {{ item.label }}
          </span>
        </li>
      </ul>
      <div class="my-4 w-full h-px bg-surface-300 dark:bg-surface-700" />
      <Button label="Buy Now" class="px-5 py-3" fluid />
    </template>
  </Card>
</template>
