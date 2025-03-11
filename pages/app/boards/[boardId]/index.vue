<script setup lang="ts">
import IconButton from "~/components/IconButton.vue";
import type { MenuItem } from "primevue/menuitem";
import type { BoardCard, BoardMember } from "~/utils/types";
import type {
  board_lists,
  board_labels,
  board_invitations,
} from "@prisma/client";
import updateCardPosition from "~/utils/updateCardPosition";

definePageMeta({
  middleware: "auth-only",
  layout: "app",
  alias: "/app/boards/:boardId/activity",
});

const route = useRoute();
const toast = useToast();
const boardsStore = useBoardsStore();
const colorMode = useColorMode();

await boardsStore.fetchBoard(route.params.boardId as string);

const showBoardDrawer = ref<boolean>(false);
const board = computed(() => {
  const currentBoard = boardsStore.boards.find(
    (b) => b.id === route.params.boardId && "labels" in b,
  ) as DetailedBoard;

  if (import.meta.client && currentBoard.background_type === "image")
    // eslint-disable-next-line vue/no-async-in-computed-properties
    isImageLight(currentBoard.background).then(
      (value) => (colorMode.value = value ? "light" : "dark"),
    );

  return currentBoard;
});
const isNewCardModalOpen = ref<boolean>(false);
const isNewListModalOpen = ref<boolean>(false);
const createCardInitialValues = ref<{ parentList: string }>({ parentList: "" });
const createMenu = ref();
const createMenuItems = ref<MenuItem[]>([
  {
    label: "Create...",
    items: [
      {
        label: "List",
        command: () => {
          isNewListModalOpen.value = true;
        },
      },
      {
        label: "Card",
        command: () => {
          createCardInitialValues.value = { parentList: "" };
          isNewCardModalOpen.value = true;
        },
      },
    ],
  },
]);
const isSearchDialogOpen = ref<boolean>(false);
const searchQuery = ref<string>("");

function renameBoard(value: string) {
  boardsStore.renameBoard(route.params.boardId as string, value, toast);
}

onMounted(async () => {
  const eventSource = new EventSource(
    `${window.location.origin}/api/events?boardId=${route.params.boardId}`,
  );

  eventSource.onmessage = (event) => {
    const message: { type: string; data: unknown } = JSON.parse(event.data);

    switch (message.type) {
      case "board_updated": {
        boardsStore.mergeBoards(
          route.params.boardId as string,
          message.data as DetailedBoard,
        );
        break;
      }
      case "card_created": {
        (
          boardsStore.boards.find(
            (b) => b.id === (route.params.boardId as string) && "labels" in b,
          ) as DetailedBoard
        ).lists
          .find((l) => l.id === (message.data as BoardCard).parent_list)!
          .cards.push(message.data as BoardCard);
        break;
      }
      case "card_updated": {
        const updatedCard = message.data as BoardCard;
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;

        currentBoard.lists = updateCardPosition(updatedCard, currentBoard);

        boardsStore.mergeCards(route.params.boardId as string, updatedCard);

        break;
      }
      case "card_deleted": {
        const card = message.data as { id: string; parent_list: string };
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        const parentList = currentBoard.lists.find(
          (l) => l.id === card.parent_list,
        )!;

        parentList.cards = parentList.cards.filter((c) => c.id !== card.id);

        break;
      }
      case "label_updated": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;

        const updatedLabel = message.data as board_labels;
        const labelIndex = currentBoard.labels.findIndex(
          (l) => l.id === updatedLabel.id,
        );
        currentBoard.labels[labelIndex] = message.data as board_labels;
        break;
      }
      case "label_created": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        currentBoard.labels.push(message.data as board_labels);
        break;
      }
      case "label_deleted": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        currentBoard.labels = currentBoard.labels.filter(
          (l) => l.id !== message.data,
        );

        currentBoard.lists.forEach((l) => {
          l.cards.forEach((c) => {
            if (c.labels.includes({ label_id: message.data as string }))
              c.labels = c.labels.filter((label) => label !== message.data);
          });
        });

        break;
      }
      case "invitation_created": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        currentBoard.invitations.push(message.data as board_invitations);
        break;
      }
      case "invitation_deleted": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        currentBoard.invitations = currentBoard.invitations.filter(
          (invitation) => invitation.id !== (message.data as string),
        ) as DetailedBoard["invitations"];
        break;
      }
      case "invitation_updated": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;

        const updatedInvitation = message.data as board_invitations & {
          avatar: string;
        };
        const invitationIndex = currentBoard.invitations.findIndex(
          (l) => l.id === updatedInvitation.id,
        );
        currentBoard.invitations[invitationIndex] =
          message.data as board_invitations & { avatar: string };
        break;
      }
      case "member_created": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        currentBoard.members.push(message.data as BoardMember);

        toast.add({
          severity: "info",
          summary: "Info",
          detail: `${(message.data as BoardMember).full_name} just joined the board!`,
          life: 5000,
        });
        break;
      }
      case "member_updated": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;

        const updatedMember = message.data as BoardMember;
        const memberIndex = currentBoard.members.findIndex(
          (l) => l.id === updatedMember.id,
        );
        currentBoard.members[memberIndex] = updatedMember;
        break;
      }
      case "member_deleted": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        currentBoard.members = currentBoard.members.filter(
          (member) => member.id !== (message.data as string),
        ) as BoardMember[];
        break;
      }
      case "list_created": {
        const currentBoard = boardsStore.boards.find(
          (b) => b.id === (route.params.boardId as string) && "labels" in b,
        ) as DetailedBoard;
        currentBoard.lists.push({
          ...(message.data as board_lists),
          cards: [],
        } as BoardList);
        break;
      }
    }
  };

  eventSource.onerror = () => {
    toast.add({
      severity: "error",
      summary: "Error",
      detail:
        "Real-time connection lost. Try reloading the page to reestablish it.",
    });
  };
});
</script>

<template>
  <main v-if="board" class="max-h-screen min-w-screen">
    <div class="flex items-center justify-between gap-4">
      <InvisibleInput
        v-model:value="board.title"
        class="text-4xl font-bold min-w-72"
        :max-length="20"
        @submit="(value) => renameBoard(value)"
      />
      <div class="flex items-center gap-2">
        <IconButton
          v-if="board.current_user_role !== 'reader'"
          icon="pi pi-plus"
          @click="(e) => createMenu.toggle(e)"
        />
        <IconButton
          icon="pi pi-search"
          @click="isSearchDialogOpen = !isSearchDialogOpen"
        />
        <IconButton icon="pi pi-filter" />
        <IconButton icon="pi pi-ellipsis-h" @click="showBoardDrawer = true" />
      </div>
    </div>
    <Divider />
    <div
      v-if="board && board.lists.length > 0"
      class="flex items-start gap-2 overflow-x-scroll"
    >
      <BoardList
        v-for="list in board.lists"
        :key="list.id"
        :list="list"
        :search-query="searchQuery"
        :parent-board="board"
        @create-card="
          () => {
            createCardInitialValues = { parentList: list.id };
            isNewCardModalOpen = true;
          }
        "
      />
    </div>
    <div
      v-else-if="board"
      class="flex justify-center items-center flex-col gap-4 my-32 lg:my-72"
    >
      <p class="text-center">It's a bit empty here...</p>
      <Button
        v-if="board.current_user_role !== 'reader'"
        icon="pi pi-plus"
        label="Create list"
        @click="
          () => {
            isNewListModalOpen = true;
          }
        "
      />
    </div>

    <LazyBoardManagementDrawer
      v-model:show-board-drawer="showBoardDrawer"
      :board="board"
    />

    <LazyCreateCardDialog
      v-model:is-new-card-modal-open="isNewCardModalOpen"
      :board="board"
      :initial-values="createCardInitialValues"
    />

    <LazyCreateListDialog
      v-model:is-new-list-modal-open="isNewListModalOpen"
      :board="board"
    />

    <Menu
      id="createSomethingMenu"
      ref="createMenu"
      :model="createMenuItems"
      popup
    />

    <Dialog
      v-model:visible="isSearchDialogOpen"
      :style="{ width: '60vw' }"
      :breakpoints="{ '1199px': '90vw' }"
      content-style="padding: 0;"
      position="top"
      :draggable="false"
      @hide="searchQuery = ''"
    >
      <template #header>
        <InputText
          v-model="searchQuery"
          fluid
          class="mr-6"
          placeholder="Start typing to search..."
          autofocus
        />
      </template>
      <p
        v-if="
          board.lists
            .reduce((acc: BoardCard[], list) => acc.concat(list.cards), [])
            .filter((card) => !searchQuery || card.title.includes(searchQuery))
            .length === 0
        "
        class="text-center italic pb-4"
      >
        No results
      </p>
    </Dialog>
  </main>
</template>
