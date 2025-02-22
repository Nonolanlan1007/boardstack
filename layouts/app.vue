<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem";
import type { FormSubmitEvent } from "@primevue/forms";
import CustomIcon from "~/components/CustomIcon.vue";

const cookies = useCookie("nuxt-session");
const toast = useToast();
const route = useRoute();
const colorMode = useColorMode();

const boardsStore = useBoardsStore();

const { data: user, error: userError } =
  await useFetch<UserProfile>(`/api/users/@me`);

if (userError.value || !user.value) {
  cookies.value = null;
  setTimeout(async () => navigateTo("/signin"), 100);
}

await callOnce(() => boardsStore.fetchBoards(user.value!));

const mainMenuItems = computed<MenuItem[]>(() => [
  {
    label: "Your boards",
    items: boardsStore.boards
      .filter((board) => user.value && board.owner_id === user.value.id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((board) => ({
        label: board.title,
        route: `/app/boards/${board.id}`,
      })),
    key: "boards",
  },
  boardsStore.boards.filter(
    (board) => user.value && board.owner_id !== user.value.id,
  ).length > 0
    ? {
        label: "Shared with you",
        items: boardsStore.boards
          .filter((board) => user.value && board.owner_id !== user.value.id)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          )
          .map((board) => ({
            label: board.title,
            route: `/app/boards/${board.id}`,
          })),
      }
    : {},
]);

function toggleColorMode() {
  colorMode.value = colorMode.value === "dark" ? "light" : "dark";
}

const accountMenuItems = computed<MenuItem[]>(() => [
  colorMode.value === "light"
    ? {
        label: "Dark mode",
        icon: "pi pi-moon",
        command: toggleColorMode,
      }
    : {
        label: "Light mode",
        icon: "pi pi-sun",
        command: toggleColorMode,
      },
  {
    label: "Account Settings",
    icon: "pi pi-user",
    route: "/app/account/settings",
  },
  {
    label: "Sign out",
    icon: "pi pi-sign-out",
    command: () => {
      navigateTo("/api/auth/signout", { external: true });
    },
  },
]);
const accountMenu = ref();
const isNewBoardModalOpen = ref<boolean>(false);
const initialValues = ref({ radio: "blank" });
/*
 * 0 -> Trello or blank board
 * 1 -> Create blank board
 */
const step = ref<number>(0);
const isLoading = ref<boolean>(false);
const board = computed(() =>
  boardsStore.boards.find((b) => b.id === route.params.boardId),
);
const backgroundColor = computed(() => {
  if (!board.value) return "";

  return getBackgroundColor(board.value.background);
});

const toggle = (event: Event) => {
  accountMenu.value.toggle(event);
};

function blankBoardResolver({ values }: FormSubmitEvent) {
  const errors: { [key: string]: { message: string }[] } = {};

  if (!values.title) errors.title = [{ message: "Title is required" }];
  if (values.description && values.description.length > 100)
    errors.description = [
      { message: "Description can't be longer than 100 characters" },
    ];

  return { errors };
}

async function createBlankBoard({ valid, states }: FormSubmitEvent) {
  if (valid) {
    isLoading.value = true;
    const res = await fetch(`/api/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: states.title.value,
        description: states.description.value || null,
      }),
    }).catch((res) => res);
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

    isLoading.value = true;
    await boardsStore.fetchBoards(user.value!);
    isLoading.value = false;
    isNewBoardModalOpen.value = false;
    step.value = 0;
  }
}
</script>

<template>
  <main
    :class="
      cn(
        'flex min-h-screen',
        board && board.background_type === 'image'
          ? 'bg-center bg-no-repeat bg-cover bg-fixed'
          : backgroundColor,
      )
    "
    :style="
      board && board.background_type === 'image'
        ? `background-image: url('${board.background}'); :`
        : ''
    "
  >
    <div class="card flex justify-center">
      <Menu :model="mainMenuItems" class="w-full md:w-60 flex flex-col">
        <template #start>
          <NuxtLink
            to="/"
            class="flex items-center gap-2 m-2 p-2 hover:bg-emphasis color-black dark:color-white"
          >
            <CustomIcon icon="logo" class="h-10 w-10" />
            <p class="text-3xl font-bold">BoardStack</p>
          </NuxtLink>
        </template>
        <template #submenuheader="{ item }">
          <div class="flex items-center gap-2 justify-between">
            {{ item.label }}
            <span
              v-if="item.key === 'boards'"
              class="pi pi-plus cursor-pointer rounded-full hover:bg-emphasis transition"
              @click="isNewBoardModalOpen = true"
            />
          </div>
        </template>
        <template #item="{ item, props }">
          <NuxtLink
            v-ripple
            :to="item.route"
            :class="
              cn(
                'flex items-center',
                item.route === route.path ? 'bg-emphasis rounded' : '',
              )
            "
            v-bind="props.action"
          >
            <span :class="item.icon" />
            <span>{{ item.label }}</span>
            <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
            <span
              v-if="item.shortcut"
              class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1"
            >
              {{ item.shortcut }}
            </span>
          </NuxtLink>
        </template>
        <template v-if="user" #end>
          <Menu
            id="overlay_menu"
            ref="accountMenu"
            :model="accountMenuItems"
            :popup="true"
          >
            <template #item="{ item, props }">
              <NuxtLink
                v-ripple
                :to="item.route"
                class="flex items-center text-sm"
                v-bind="props.action"
              >
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
              </NuxtLink>
            </template>
          </Menu>
          <button
            v-ripple
            class="relative overflow-hidden w-full border-0 bg-transparent flex items-center p-2 pl-4 hover:bg-emphasis rounded-none cursor-pointer transition-colors duration-200"
            @click="toggle"
          >
            <Avatar :image="user.avatar" class="mr-2" shape="circle" />
            <span class="font-bold">{{ user.full_name }}</span>
          </button>
        </template>
      </Menu>
    </div>
    <div class="w-full px-8 py-6">
      <slot />
    </div>

    <Dialog
      v-model:visible="isNewBoardModalOpen"
      modal
      header="Create a new board"
      :style="{ width: '25vw' }"
      :breakpoints="{ '1199px': '50vw', '575px': '90vw' }"
      dismissable-mask
    >
      <Form
        v-if="step === 0"
        v-slot="$form"
        class="flex flex-col justify-center items-center gap-2 w-full"
        :initial-values="initialValues"
        @submit="
          ({ states }: FormSubmitEvent) => {
            if (states.radio.value === 'blank') step = 1;
          }
        "
      >
        <RadioButtonGroup
          name="radio"
          class="w-full flex items-center justify-center gap-2 flex-col"
        >
          <div
            :aria-checked="$form.radio && $form.radio.value === 'trello-import'"
            class="flex items-center justify-between px-2 border-2 border-transparent aria-checked:border-primary rounded-md w-full transition"
          >
            <label
              for="trello-import"
              class="flex items-center gap-2 cursor-pointer w-full py-4 pr-2"
            >
              <CustomIcon icon="trello-blue" class="h-8 w-8" />
              Import from Trello
            </label>
            <RadioButton input-id="trello-import" value="trello-import" />
          </div>
          <div
            :aria-checked="$form.radio && $form.radio.value === 'blank'"
            class="flex items-center justify-between px-2 border-2 border-transparent aria-checked:border-primary rounded-md w-full transition"
          >
            <label
              for="blank"
              class="flex items-center gap-2 cursor-pointer w-full py-4 pr-2"
            >
              <i class="pi pi-pen-to-square text-3xl" />
              Create blank board
            </label>
            <RadioButton input-id="blank" value="blank" />
          </div>
        </RadioButtonGroup>

        <div class="flex justify-end w-full mt-4">
          <Button type="submit" label="Continue" class="w-full md:w-min" />
        </div>
      </Form>
      <Form
        v-else-if="step === 1"
        v-slot="$form"
        :resolver="blankBoardResolver"
        class="flex flex-col justify-center items-center gap-2 w-full"
        @submit="createBlankBoard"
      >
        <div class="flex flex-col gap-1 w-full">
          <label for="title">Title</label>
          <InputText
            name="title"
            type="text"
            placeholder="My awesome board"
            fluid
          />
          <Message
            v-if="$form.title?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.title.error.message }}
          </Message>
        </div>
        <div class="flex flex-col gap-1 w-full">
          <label for="description">Description</label>
          <Textarea
            name="description"
            auto-resize
            placeholder="This board is used to..."
            :max="100"
          />
          <Message
            v-if="$form.description?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.description.error.message }}
          </Message>
        </div>

        <div
          class="flex justify-end w-full mt-4 flex-col-reverse gap-2 md:flex-row"
        >
          <Button
            label="Back"
            variant="outlined"
            class="w-full md:w-min"
            :disabled="isLoading"
            @click="step = 0"
          />
          <Button
            type="submit"
            label="Continue"
            :loading="isLoading"
            class="w-full md:w-min"
          />
        </div>
      </Form>
    </Dialog>

    <div
      v-if="board && board.background_credits"
      class="flex items-center gap-1 fixed bottom-4 right-4 text-xs text-white rounded bg-black bg-opacity-10 p-1 select-none"
    >
      <a
        :href="board.background_credits.split(',')[1]"
        class="underline hover:opacity-75 transition"
        target="_blank"
      >
        {{ board.background_credits.split(",")[0] }}
      </a>
      on
      <a
        href="https://unsplash.com"
        class="underline hover:opacity-75 transition"
        target="_blank"
      >
        Unsplash
      </a>
    </div>
  </main>
</template>

<style>
.p-menu-list {
  @apply flex-1;
}
</style>
