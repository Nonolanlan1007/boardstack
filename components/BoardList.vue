<script setup lang="ts">
import IconButton from "~/components/IconButton.vue";
import { useDragAndDrop } from "@formkit/drag-and-drop/vue";

const props = defineProps<{
  list: BoardList;
  searchQuery?: string;
  parentBoard: DetailedBoard;
}>();
defineEmits(["createCard"]);

const [listRef, elements] = useDragAndDrop(props.list.cards, {
  group: `drag-in-board`,
  sortable: true,
  dropZoneClass: "",
  dropZoneParentClass: "!border-4 border-lime-300",
  synthDropZoneClass: "!bg-lime-200",
  synthDropZoneParentClass: "!border-4 border-lime-300",
});
</script>

<template>
  <div
    class="min-w-72 w-72 flex flex-col gap-2"
    :class="list.hide_when_blank && list.cards.length === 0 ? 'hidden' : ''"
  >
    <div class="flex items-center justify-between gap-2 px-2 pt-2">
      <h2 class="text-lg font-semibold">{{ list.title }}</h2>
      <IconButton
        v-if="parentBoard.current_user_role !== 'reader'"
        icon="pi pi-plus"
        @click="$emit('createCard')"
      />
    </div>
    <div
      ref="listRef"
      class="flex items-center flex-col gap-2 overflow-y-auto h-[calc(100vh-200px)]"
    >
      <BoardCard
        v-for="card in elements"
        :key="card.id"
        :card="card"
        :parent-board="parentBoard"
      />
    </div>
  </div>
</template>
