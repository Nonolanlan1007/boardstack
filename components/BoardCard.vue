<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem";
import type { BoardCard } from "~/utils/types";

const props = defineProps<{
  card: BoardCard;
  parentBoard: DetailedBoard;
}>();

const toast = useToast();

const openRenameDialog = ref<boolean>(false);
const contextMenu = ref();

const contextMenuItems = computed((): MenuItem[] => [
  {
    label: "Open card",
    icon: "pi pi-window-maximize",
  },
  {
    label: "Edit labels",
    icon: "pi pi-tags",
    key: "labels",
  },
  {
    label: "Rename card",
    icon: "pi pi-pen-to-square",
    command: () => {
      openRenameDialog.value = true;
    },
  },
  {
    label: "Move card to...",
    icon: "pi pi-arrows-alt",
    items: props.parentBoard.lists
      .filter((list) => !list.cards.includes(props.card))
      .sort((a, b) => a.position - b.position)
      .map((list) => ({
        label: list.title,
        command: () => moveCard(list.id),
      })),
  },
  {
    label: "Duplicate card",
    icon: "pi pi-clone",
  },
  {
    label: "Delete card",
    icon: "pi pi-trash",
  },
]);
const isLoading = ref<boolean>(false);

function onCardRightClick(event: Event) {
  contextMenu.value.show(event);
}

async function moveCard(newParentList: string) {
  const newPos =
    props.parentBoard.lists.find((l) => l.id === newParentList)!.cards.length +
    1;

  if (props.card.parent_list === newParentList) return;

  const res = await fetch(
    `/api/boards/${props.parentBoard.id}/cards/${props.card.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parent_list: newParentList,
        position: newPos,
      }),
    },
  ).catch((res) => res);

  if (!res.ok) {
    const data = await res.json();

    return toast.add({
      severity: "error",
      summary: "Error",
      detail: `${res.status} - ${data.message}`,
      life: 5000,
    });
  }
}
</script>

<template>
  <Card
    class="w-full min-h-15 hover:bg-opacity-30 cursor-pointer bg-white dark:bg-black bg-opacity-15 dark:bg-opacity-15 backdrop-blur p-4 rounded-md select-none board-card"
    unstyled
    @contextmenu="onCardRightClick($event)"
  >
    <template #content>{{ card.title }}</template>
    <template #footer>
      <div class="flex items-center gap-2 flex-wrap mt-1">
        <i
          v-if="card.description"
          class="pi pi-align-left text-xs opacity-75"
        />
        <Tag
          v-for="label in card.labels
            .map((label) => {
              const data = parentBoard.labels.find(
                (l) => l.id === label.label_id,
              );
              return {
                label: data!.label,
                color: data!.color,
                id: label.label_id,
              };
            })
            .slice(0, 3)"
          :key="label.id"
          unstyled
          class="text-black dark:text-white bg-white dark:bg-black bg-opacity-50 dark:bg-opacity-50 text-center flex items-center justify-center py-1 px-2 font-semibold rounded-md"
          :style="`background: ${label.color};`"
        >
          <span class="text-xs">{{ label.label }}</span>
        </Tag>
        <Tag
          v-if="card.labels.length > 3"
          unstyled
          class="text-black dark:text-white bg-white dark:bg-black bg-opacity-50 dark:bg-opacity-50 text-center flex items-center justify-center py-1 px-2 font-semibold rounded-md"
        >
          <span class="text-xs">+{{ card.labels.length - 3 }}</span>
        </Tag>
      </div>
    </template>
  </Card>

  <ContextMenu ref="contextMenu" :model="contextMenuItems">
    <template #item="{ item, props }">
      <a v-ripple class="flex items-center" v-bind="props.action">
        <span :class="item.icon" />
        <span class="ml-2">{{ item.label }}</span>
        <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
        <span
          v-if="item.shortcut"
          class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1"
        >
          {{ item.shortcut }}
        </span>
        <i v-if="item.items" class="pi pi-angle-right ml-auto" />
      </a>
    </template>
  </ContextMenu>

  <Dialog
    v-model:visible="openRenameDialog"
    modal
    header="Create a new board"
    :style="{ width: '25vw' }"
    :breakpoints="{ '1199px': '50vw', '575px': '90vw' }"
    dismissable-mask
  >
    <Form v-slot="$form" :initial-values="card">
      <div class="flex flex-col gap-1 w-full">
        <label for="title">Title</label>
        <InputText placeholder="Card Title" type="text" name="title" fluid />
        <Message
          v-if="$form.title?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.title.error.message }}
        </Message>
      </div>

      <div
        class="flex justify-end w-full mt-4 flex-col-reverse gap-2 md:flex-row"
      >
        <Button
          type="submit"
          label="Continue"
          :loading="isLoading"
          class="w-full md:w-min"
        />
      </div>
    </Form>
  </Dialog>
</template>
