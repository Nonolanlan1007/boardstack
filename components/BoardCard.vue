<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem";
import type { BoardCard } from "~/utils/types";
import type { FormSubmitEvent } from "@primevue/forms";

const props = defineProps<{
  card: BoardCard;
  parentBoard: DetailedBoard;
}>();

const toast = useToast();
const route = useRoute();

const { user } = useUserStore();

const openRenameDialog = ref<boolean>(false);
const contextMenu = ref();
const showCard = ref<boolean>(false);
const showFullDesc = ref<boolean>(false);
const editDesc = ref<boolean>(false);
const cardTitle = ref<string>(props.card.title);

if (route.query.card && route.query.card === props.card.id)
  showCard.value = true;

const cardCreator = computed(() =>
  [...props.parentBoard.members, user!].find((member) =>
    "user_id" in member
      ? member.user_id === props.card.created_by
      : member.id === props.card.created_by,
  ),
);

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
    command: duplicateCard,
  },
  {
    label: "Delete card",
    icon: "pi pi-trash",
    command: deleteCard,
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

async function duplicateCard() {
  const res = await fetch(
    `/api/boards/${route.params.boardId as string}/cards`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: props.card.title,
        description: props.card.description ? props.card.description : null,
        parentList: props.card.parent_list,
        labels:
          props.card.labels && props.card.labels.length > 0
            ? props.card.labels
            : undefined,
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

async function renameCard({ states, valid }: FormSubmitEvent) {
  if (valid) {
    isLoading.value = true;
    const res = await fetch(
      `/api/boards/${route.params.boardId as string}/cards/${props.card.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: states.title.value,
        }),
      },
    ).catch((res) => res);
    isLoading.value = false;

    if (!res.ok) {
      const data = await res.json();

      return toast.add({
        severity: "error",
        summary: "Error",
        detail: `${res.status} - ${data.message}`,
        life: 5000,
      });
    }

    openRenameDialog.value = false;

    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Card renamed`,
      life: 3000,
    });
  }
}

async function deleteCard() {
  const res = await fetch(
    `/api/boards/${route.params.boardId as string}/cards/${props.card.id}`,
    {
      method: "DELETE",
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

async function editLabels(newLabels: string[]) {
  if (props.card.labels.map((l) => l.label_id) === newLabels) return;

  const res = await fetch(
    `/api/boards/${props.parentBoard.id}/cards/${props.card.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        labels: newLabels,
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

watch(route, (value) => {
  if (value.query.card && value.query.card === props.card.id)
    showCard.value = true;
});

watch(props, (value) => (cardTitle.value = value.card.title));
</script>

<template>
  <NuxtLink :to="`${route.path}?card=${card.id}`">
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
  </NuxtLink>

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
    header="Rename card"
    :style="{ width: '25vw' }"
    :breakpoints="{ '1199px': '50vw', '575px': '90vw' }"
    dismissable-mask
  >
    <Form
      v-slot="$form"
      :initial-values="card"
      :resolver="
        ({ values }: FormSubmitEvent) => {
          const errors: { [key: string]: { message: string }[] } = {};

          if (!values.title || values.title === '')
            errors.title = [{ message: 'Title is required' }];
          else if (values.title.length > 50)
            errors.title = [{ message: 'Title is too long' }];

          return { errors };
        }
      "
      @submit="renameCard"
    >
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

  <Dialog
    v-model:visible="showCard"
    modal
    :style="{ width: '60vw' }"
    :breakpoints="{ '1199px': '70vw' }"
    dismissable-mask
    :draggable="false"
    @hide="
      () => {
        showFullDesc = false;
        editDesc = false;
        navigateTo(route.path);
      }
    "
  >
    <template #header>
      <div>
        <InvisibleInput
          v-model:value="cardTitle"
          :max-length="50"
          class="text-4xl font-bold w-[48rem]"
          :disabled="parentBoard.current_user_role === 'reader'"
          @submit="
            (value) => renameCard({ valid: true, states: { title: { value } } })
          "
        />
        <div v-if="cardCreator" class="flex items-center gap-1 my-2">
          <Avatar
            :image="cardCreator.avatar"
            shape="circle"
            class="!h-6 !w-6"
          />
          <p>{{ cardCreator.full_name }}</p>
        </div>
      </div>
    </template>
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
      <div class="md:col-span-4">
        <div class="flex flex-col gap-1 w-full mb-2">
          <label>Description</label>
          <div
            v-if="card.description"
            :class="
              cn(
                'relative rounded',
                !editDesc ? 'border dark:border-surface-800' : '',
              )
            "
          >
            <div
              v-if="!editDesc"
              @click="
                () => {
                  if (
                    showFullDesc &&
                    parentBoard.current_user_role !== 'reader'
                  )
                    editDesc = true;
                }
              "
            >
              <MDC
                :value="card.description"
                :class="
                  cn(
                    'p-4',
                    !showFullDesc
                      ? 'max-h-64 overflow-clip'
                      : parentBoard.current_user_role === 'reader'
                        ? ''
                        : 'cursor-text',
                  )
                "
              />
            </div>
            <div v-else>
              <Editor
                name="description"
                editor-style="height: 320px;"
                :default-value="card.description || ''"
              />
              <div class="flex items-center justify-end w-full gap-2 my-2">
                <Button
                  variant="outlined"
                  label="Cancel"
                  @click="
                    () => {
                      editDesc = false;
                    }
                  "
                />
                <Button label="Save" />
              </div>
            </div>
            <div
              v-if="!showFullDesc"
              class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-surface-50 dark:from-surface-800 dark:brightness-50 hover:dark:from-surface-950 hover:from-surface-100 from-75% to-transparent h-32 flex items-center justify-center cursor-pointer transition-all"
              @click="showFullDesc = true"
            >
              <p>Click to expand</p>
            </div>
          </div>
          <p
            v-else
            class="w-full text-center p-6 italic cursor-pointer opacity-75 hover:opacity-100 transition-all"
          >
            Click to add a description
          </p>
        </div>
      </div>
      <div class="md:col-span-2">
        <div class="flex flex-col gap-1 w-full mb-2">
          <label for="parentList">Parent list</label>
          <Select
            name="parentList"
            placeholder="Select a list"
            fluid
            :options="parentBoard.lists"
            option-label="title"
            option-value="id"
            :default-value="card.parent_list"
            :disabled="parentBoard.current_user_role === 'reader'"
            @value-change="(value) => moveCard(value)"
          />
        </div>

        <div class="flex flex-col gap-1 w-full">
          <label for="labels">Labels</label>
          <MultiSelect
            display="chip"
            :options="parentBoard.labels"
            option-label="label"
            option-value="id"
            filter
            fluid
            placeholder="Select labels"
            name="labels"
            :max-selected-labels="2"
            :default-value="card.labels.map((l) => l.label_id)"
            :disabled="parentBoard.current_user_role === 'reader'"
            @value-change="(value) => editLabels(value)"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
