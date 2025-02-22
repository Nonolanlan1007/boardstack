<script setup lang="ts">
const props = defineProps<{ text: string; image: string }>();
const emits = defineEmits(["click"]);

function onClick() {
  emits("click", props.text);
}
</script>

<template>
  <div
    class="h-24 rounded w-[calc(50%-.5rem)] cursor-pointer overflow-clip relative hover:brightness-75 transition group"
    @click="onClick"
  >
    <Skeleton width="100%" height="100%" />
    <img
      :src="image"
      class="h-full absolute w-full z-10 top-0 left-0 brightness-75 object-cover object-center"
    />
    <p
      class="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-white"
    >
      {{ text }}
    </p>
  </div>
</template>
