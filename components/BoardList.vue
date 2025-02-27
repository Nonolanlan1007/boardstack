<script setup lang="ts">
import IconButton from "~/components/IconButton.vue";
import { Container, Draggable } from "vue-dndrop";
import type { BoardCard } from "~/utils/types";
import updateCardPosition from "~/utils/updateCardPosition";

const props = defineProps<{
  list: BoardList;
  searchQuery?: string;
  parentBoard: DetailedBoard;
}>();
defineEmits(["createCard"]);

interface VueDndDropEvent {
  removedIndex: number | null;
  addedIndex: number | null;
  payload: BoardCard;
}

const toast = useToast();
const boardsStore = useBoardsStore();
const route = useRoute();

async function onCardDrop(event: VueDndDropEvent) {
  if (event.addedIndex !== null) {
    const card = event!.payload;
    const newParentList = props.list.id;
    const newPos = event.addedIndex;
    const oldLists = props.parentBoard.lists;

    if (card.position === newPos && card.parent_list === newParentList) return;

    const updatedCard = {
      ...card,
      ...(newParentList !== card.parent_list && {
        parent_list: newParentList,
      }),
      ...(newPos !== card.position && { position: newPos }),
    };
    const currentBoard = boardsStore.boards.find(
      (b) => b.id === (route.params.boardId as string) && "labels" in b,
    ) as DetailedBoard;

    currentBoard.lists = updateCardPosition(updatedCard, currentBoard);

    const res = await fetch(
      `/api/boards/${props.parentBoard.id}/cards/${card.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(newParentList !== card.parent_list && {
            parent_list: newParentList,
          }),
          ...(newPos !== card.position && { position: newPos }),
        }),
      },
    ).catch((res) => res);

    if (!res.ok) {
      const data = await res.json();

      currentBoard.lists = oldLists;

      return toast.add({
        severity: "error",
        summary: "Error",
        detail: `${res.status} - ${data.message}`,
        life: 5000,
      });
    }
  }
}
</script>

<template>
  <div
    class="min-w-72 w-72 flex flex-col gap-2 h-[calc(100vh-200px)]"
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
    <Container
      group-name="board-list"
      :get-child-payload="(index: number) => list.cards[index]"
      drag-class="card-ghost"
      drop-class="card-ghost-drop"
      class="flex items-center flex-col gap-2 overflow-y-auto h-[calc(100vh-200px)] board-cards-list"
      :drop-placeholder="{
        className: 'drop-preview',
        animationDuration: '150',
        showOnTop: true,
      }"
      @drop="(e: VueDndDropEvent) => onCardDrop(e)"
      @drag-start="(e) => console.log('drag start', e)"
      @drag-end="(e) => console.log('drag end', e)"
    >
      <Draggable
        v-for="card in list.cards"
        :key="card.id"
        class="w-full"
        :drag-not-allowed="parentBoard.current_user_role === 'reader'"
      >
        <BoardCard :card="card" :parent-board="parentBoard" />
      </Draggable>
    </Container>
  </div>
</template>
