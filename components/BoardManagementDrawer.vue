<script lang="ts" setup>
import { FilterMatchMode } from "@primevue/core/api";
import type { DataTableCellEditCompleteEvent } from "primevue";
import type { FormResolverOptions, FormSubmitEvent } from "@primevue/forms";

const showBoardDrawer = defineModel<boolean>("showBoardDrawer");
const props = defineProps<{ board: DetailedBoard }>();

const colorMode = useColorMode();
const toast = useToast();
const { copy } = useClipboard();
const route = useRoute();
const boardsStore = useBoardsStore();

/**
 * 0 -> Default menu
 * 1 -> Rename board
 * 2 -> Edit background
 * 3 -> Edit labels
 * 4 -> Create label
 * 5 -> Manage access
 * 6 -> Invite user to board
 */
const boardDrawerStep = ref<number>(0);
const newBoardName = ref<string>("");
const isLoading = ref<boolean>(false);
const logs = ref<ActivityLog[]>([]);
const unsplashQuery = ref<string>("");
const unsplashResults = ref<{ query: string; results: any[] }>({
  query: "",
  results: [],
});
const labelsTableFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const isActivityDialogOpen = ref<boolean>(false);

const backgroundColor = computed(() =>
  getBackgroundColor(props.board.background),
);

function copyBoardId() {
  copy(props.board.id);

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Board ID copied to clipboard",
  });
}

function renameBoard(value: string) {
  boardsStore.renameBoard(route.params.boardId as string, value, toast);
}

async function unsplashSearch() {
  if (unsplashQuery.value === unsplashResults.value.query) return;

  isLoading.value = true;
  const res = await fetch(
    `/api/unsplash/search?q=${encodeURIComponent(unsplashQuery.value)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "force-cache",
    },
  ).catch((res) => res);
  isLoading.value = false;

  const data = await res.json();

  if (!res.ok)
    return toast.add({
      severity: "error",
      summary: "Error",
      detail: `${res.status} - ${data.message}`,
      life: 5000,
    });

  unsplashResults.value = {
    query: unsplashQuery.value,
    results: data.results,
  };
}

async function updateBackground(
  type: "color" | "image",
  value: string,
  credits?: string,
) {
  toast.add({
    severity: "info",
    summary: "Loading",
    detail: "Updating background...",
    closable: false,
  });

  const res = await fetch(`/api/boards/${route.params.boardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      background: value,
      background_type: type,
      background_credits: credits || null,
    }),
  }).catch((res) => res);
  toast.removeAllGroups();

  if (!res.ok) {
    const data = await res.json();

    return toast.add({
      severity: "error",
      summary: "Error",
      detail: `${res.status} - ${data.message}`,
      life: 5000,
    });
  }

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Board background updated",
    life: 3000,
  });
}

async function updateLabel({
  newValue,
  field,
  data,
  value,
}: DataTableCellEditCompleteEvent) {
  if (newValue === value) return;

  toast.add({
    severity: "info",
    summary: "Loading",
    detail: "Updating label...",
    closable: false,
  });

  const res = await fetch(
    `/api/boards/${route.params.boardId}/labels/${data.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: field === "label" ? newValue : undefined,
        color: field === "color" ? data[field] : undefined,
      }),
    },
  ).catch((res) => res);
  toast.removeAllGroups();

  if (!res.ok) {
    const data = await res.json();

    return toast.add({
      severity: "error",
      summary: "Error",
      detail: `${res.status} - ${data.message}`,
      life: 5000,
    });
  }

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Label updated",
    life: 3000,
  });
}

async function createLabel({ valid, states }: FormSubmitEvent) {
  if (!valid) return;

  isLoading.value = true;
  const res = await fetch(`/api/boards/${route.params.boardId}/labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      label: states.label.value,
      color: states.color.value || "FF0000",
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

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Label created",
    life: 3000,
  });

  boardDrawerStep.value = 3;
}

async function deleteLabel(labelId: string) {
  const res = await fetch(
    `/api/boards/${route.params.boardId}/labels/${labelId}`,
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

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Label deleted",
    life: 3000,
  });
}

async function deleteMemberInvitation(invitationId: string) {
  const res = await fetch(
    `/api/boards/${route.params.boardId}/invitations/${invitationId}`,
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

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Invitation deleted",
    life: 3000,
  });
}

async function createInvitation({ valid, states }: FormSubmitEvent) {
  if (!valid) return;

  isLoading.value = true;
  const res = await fetch(`/api/boards/${route.params.boardId}/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: states.email.value,
      role: states.role.value,
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

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Invitation sent",
    life: 3000,
  });

  boardDrawerStep.value = 5;
}

async function updateInvitation(invitationId: string, role: string) {
  if (
    role ===
    props.board.invitations.find(
      (invitation) => invitation.id === invitationId,
    )!.role
  )
    return;

  toast.add({
    severity: "info",
    summary: "Loading",
    detail: "Updating invitation...",
    closable: false,
  });

  const res = await fetch(
    `/api/boards/${route.params.boardId}/invitations/${invitationId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  ).catch((res) => res);
  toast.removeAllGroups();

  if (!res.ok) {
    const data = await res.json();

    return toast.add({
      severity: "error",
      summary: "Error",
      detail: `${res.status} - ${data.message}`,
      life: 5000,
    });
  }

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Invitation updated",
    life: 3000,
  });
}

async function updateMember(memberId: string, role: string) {
  if (
    role === props.board.members.find((member) => member.id === memberId)!.role
  )
    return;

  toast.add({
    severity: "info",
    summary: "Loading",
    detail: "Updating invitation...",
    closable: false,
  });

  const res = await fetch(
    `/api/boards/${route.params.boardId}/members/${memberId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  ).catch((res) => res);
  toast.removeAllGroups();

  if (!res.ok) {
    const data = await res.json();

    return toast.add({
      severity: "error",
      summary: "Error",
      detail: `${res.status} - ${data.message}`,
      life: 5000,
    });
  }

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Member updated",
    life: 3000,
  });
}

async function deleteMember(memberId: string) {
  const res = await fetch(
    `/api/boards/${route.params.boardId}/members/${memberId}`,
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

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Member kicked",
    life: 3000,
  });
}

async function refreshLogs() {
  isLoading.value = true;
  const res = await fetch(
    `/api/boards/${route.params.boardId}/activity?start=0&count=3`,
  );
  isLoading.value = false;

  const data = await res.json();

  if (!res.ok) {
    return toast.add({
      severity: "error",
      summary: "Error",
      detail: `${res.status} - ${data.message}`,
      life: 5000,
    });
  }

  logs.value = data.logs;
}
</script>

<template>
  <Drawer
    v-model:visible="showBoardDrawer"
    position="right"
    class="!w-full md:!w-80 lg:!w-[30rem]"
    @hide="
      () => {
        boardDrawerStep = 0;
        unsplashQuery = '';
        unsplashResults = {
          query: '',
          results: [],
        };
      }
    "
    @show="refreshLogs"
  >
    <template #header>
      <Button
        variant="text"
        icon="pi pi-chevron-left"
        :style="`color: ${colorMode === 'dark' ? 'white' : 'black'}`"
        :class="
          cn('transition', boardDrawerStep > 0 ? 'opacity-100' : 'opacity-0')
        "
        @click="boardDrawerStep = 0"
      />
      <h2 v-if="boardDrawerStep === 0" class="text-2xl font-bold">Menu</h2>
      <h2 v-else-if="boardDrawerStep === 1" class="text-2xl font-bold">
        Rename board
      </h2>
      <h2 v-else-if="boardDrawerStep === 2" class="text-2xl font-bold">
        Edit background
      </h2>
      <h2 v-else-if="boardDrawerStep === 3" class="text-2xl font-bold">
        Edit labels
      </h2>
      <h2 v-else-if="boardDrawerStep === 4" class="text-2xl font-bold">
        Create label
      </h2>
      <h2 v-else-if="boardDrawerStep === 5" class="text-2xl font-bold">
        Manage access
      </h2>
      <h2 v-else-if="boardDrawerStep === 6" class="text-2xl font-bold">
        Invite member
      </h2>
    </template>

    <Transition
      :name="boardDrawerStep >= 1 ? 'slide-right' : 'slide-left'"
      mode="out-in"
    >
      <div v-if="boardDrawerStep === 0" class="space-y-6" data-step="0">
        <div>
          <button
            class="opacity-50 hover:opacity-75 text-xs"
            @click="copyBoardId"
          >
            Board ID: {{ board.id }}
            <i class="pi pi-copy text-xs" />
          </button>
          <p v-if="board.description" class="mb-6 opacity-75">
            {{ board.description }}
          </p>
          <p v-else class="mb-6 opacity-50 italic">
            Click to add a description
          </p>
        </div>
        <div>
          <h3 class="text-xl font-semibold">Settings</h3>
          <BoardDrawerButton
            :disabled="!['admin', 'owner'].includes(board.current_user_role)"
            @click="() => (boardDrawerStep = 1)"
          >
            <template #icon>
              <i class="pi pi-pen-to-square w-8" />
            </template>
            <template #default> Rename board </template>
          </BoardDrawerButton>
          <BoardDrawerButton
            :disabled="!['admin', 'owner'].includes(board.current_user_role)"
            @click="() => (boardDrawerStep = 2)"
          >
            <template #icon>
              <span
                :class="
                  cn(
                    'w-8 h-5 rounded',
                    board && board.background_type === 'image'
                      ? 'bg-center bg-no-repeat bg-cover bg-fixed '
                      : backgroundColor,
                  )
                "
                :style="
                  board && board.background_type === 'image'
                    ? `background-image: url('${board.background}'); :`
                    : ''
                "
              />
            </template>
            <template #default> Edit background </template>
          </BoardDrawerButton>
          <BoardDrawerButton
            :disabled="!['admin', 'owner'].includes(board.current_user_role)"
            @click="boardDrawerStep = 5"
          >
            <template #icon>
              <i class="pi pi-users w-8" />
            </template>
            <template #default> Manage access </template>
          </BoardDrawerButton>
          <BoardDrawerButton
            :disabled="board.current_user_role === 'reader'"
            @click="() => (boardDrawerStep = 3)"
          >
            <template #icon>
              <i class="pi pi-tags w-8" />
            </template>
            <template #default> Edit labels </template>
          </BoardDrawerButton>
        </div>
        <div class="my-6">
          <h3 class="text-xl font-semibold">Activity</h3>
          <Accordion v-if="!isLoading && logs.length > 0">
            <LogAccordion
              v-for="(logData, index) in logs"
              :key="index"
              :log-data="logData"
              :index="index"
              :board="board"
            />
          </Accordion>
          <div
            v-else-if="!isLoading"
            class="flex items-center justify-center my-8"
          >
            <p>No recent activity</p>
          </div>
          <div v-else class="flex items-center justify-center my-8">
            <i class="pi pi-spinner animate-spin" />
          </div>
          <BoardDrawerButton @click="isActivityDialogOpen = true">
            <template #icon>
              <i class="pi pi-history w-8" />
            </template>
            <template #default> Open Activity </template>
          </BoardDrawerButton>
        </div>
        <div v-if="board.current_user_role === 'owner'" class="my-6">
          <h3 class="text-xl font-semibold">Danger Zone</h3>
          <BoardDrawerButton variant="danger">
            <template #icon>
              <i class="pi pi-trash w-8" />
            </template>
            <template #default> Delete board </template>
          </BoardDrawerButton>
        </div>
      </div>
      <div v-else-if="boardDrawerStep === 1" class="space-y-6" data-step="1">
        <InputText
          v-model="newBoardName"
          name="title"
          type="text"
          placeholder="My awesome board"
          fluid
          :default-value="board.title"
        />
        <div class="flex justify-end w-full mt-4">
          <Button
            type="submit"
            label="Rename"
            class="w-full md:w-min"
            @click="
              () => {
                showBoardDrawer = false;
                renameBoard(newBoardName);
              }
            "
          />
        </div>
      </div>
      <div v-else-if="boardDrawerStep === 2" class="space-y-6" data-step="2">
        <h3 class="text-xl font-semibold">Color</h3>
        <div class="flex items-center gap-2 flex-wrap">
          <span
            v-for="color in ['black', 'green', 'blue', 'orange', 'purple']"
            :key="color"
            :class="
              cn(
                'h-16 rounded w-[calc(50%-.5rem)] cursor-pointer hover:brightness-125 transition',
                board.background === color
                  ? 'outline-white outline outline-2'
                  : '',
                getBackgroundColor(color),
              )
            "
            @click="updateBackground('color', color)"
          />
        </div>
        <Divider> OR </Divider>
        <h3 class="text-xl font-semibold">Image (Unsplash)</h3>
        <IconField>
          <InputText
            v-model="unsplashQuery"
            placeholder="Search on Unsplash"
            fluid
            @focusout="unsplashSearch"
            @keyup.enter="unsplashSearch"
          />
          <InputIcon v-if="!isLoading" class="pi pi-search" />
          <InputIcon v-else class="pi pi-spin pi-spinner" />
        </IconField>
        <div
          v-if="unsplashResults.query && unsplashResults.results.length > 0"
          class="flex items-center gap-2 flex-wrap"
        >
          <div
            v-for="image in unsplashResults.results"
            :key="image.id"
            :class="
              cn(
                'h-24 rounded w-[calc(50%-.5rem)] cursor-pointer overflow-clip relative transition group',
                board.background === image.urls.raw
                  ? 'outline-white outline outline-2'
                  : '',
              )
            "
            @click="
              updateBackground(
                'image',
                image.urls.raw,
                `${image.user.name},${image.links.html}`,
              )
            "
          >
            <Skeleton width="100%" height="100%" />
            <img
              :src="image.urls.thumb"
              class="h-full absolute w-full z-10 top-0 left-0 group-hover:brightness-75 object-cover object-center"
            />
            <p
              class="absolute z-20 bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition"
            >
              {{ image.user.name }}
            </p>
          </div>
        </div>
        <p
          v-else-if="
            unsplashResults.query && unsplashResults.results.length === 0
          "
          class="opacity-75 italic text-center"
        >
          No results.
        </p>
        <div v-else class="flex items-center gap-2 flex-wrap">
          <UnsplashCategoryCard
            text="Space"
            image="https://images.unsplash.com/photo-1464802686167-b939a6910659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
            @click="
              (value: string) => {
                unsplashQuery = value;
                unsplashSearch();
              }
            "
          />
          <UnsplashCategoryCard
            text="Landscape"
            image="https://images.unsplash.com/photo-1506744038136-46273834b3fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
            @click="
              (value: string) => {
                unsplashQuery = value;
                unsplashSearch();
              }
            "
          />
          <UnsplashCategoryCard
            text="City"
            image="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
            @click="
              (value: string) => {
                unsplashQuery = value;
                unsplashSearch();
              }
            "
          />
          <UnsplashCategoryCard
            text="Abstract"
            image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
            @click="
              (value: string) => {
                unsplashQuery = value;
                unsplashSearch();
              }
            "
          />
          <UnsplashCategoryCard
            text="Monument"
            image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
            @click="
              (value: string) => {
                unsplashQuery = value;
                unsplashSearch();
              }
            "
          />
          <UnsplashCategoryCard
            text="Animal"
            image="https://images.unsplash.com/photo-1507666405895-422eee7d517f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            @click="
              (value: string) => {
                unsplashQuery = value;
                unsplashSearch();
              }
            "
          />
        </div>
      </div>
      <div v-else-if="boardDrawerStep === 3" class="space-y-6" data-step="3">
        <DataTable
          v-model:filters="labelsTableFilters"
          :value="board.labels"
          edit-mode="cell"
          @cell-edit-complete="updateLabel"
        >
          <template #header>
            <div class="flex gap-2">
              <IconField class="flex-1">
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="labelsTableFilters['global'].value"
                  placeholder="Search in labels"
                  fluid
                />
              </IconField>
              <Button
                icon="pi pi-plus"
                severity="secondary"
                @click="boardDrawerStep = 4"
              />
            </div>
          </template>
          <template #empty> No results. </template>
          <Column field="label" header="Label">
            <template #body="{ data, field }">
              {{ data[field] }}
            </template>
            <template #editor="{ data, field }">
              <InputText v-model="data[field]" autofocus fluid />
            </template>
          </Column>
          <Column field="color" header="Color">
            <template #body="{ data, field }">
              <ColorPicker
                v-model="data[field]"
                format="hex"
                @hide="
                  () =>
                    updateLabel({
                      newValue: '',
                      field,
                      data,
                    } as DataTableCellEditCompleteEvent)
                "
              />
            </template>
          </Column>
          <Column class="!text-end" row-editor>
            <template #body="{ data }">
              <Button
                icon="pi pi-trash"
                icon-class="text-red-500"
                severity="secondary"
                rounded
                @click="deleteLabel(data.id)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else-if="boardDrawerStep === 4" class="space-y-6" data-step="4">
        <Form
          v-slot="$form"
          :resolver="
            ({ values }: FormResolverOptions) => {
              const errors: { [key: string]: { message: string }[] } = {};

              if (!values.label)
                errors.label = [{ message: 'Label is required' }];
              if ((values.label as string).length > 20)
                errors.label = [
                  { message: 'Label length can\'t be higher than 20' },
                ];

              return { errors };
            }
          "
          class="flex flex-col justify-center items-center gap-2 w-full"
          @submit="createLabel"
        >
          <div class="flex flex-col gap-1 w-full">
            <label for="label">Label</label>
            <InputText
              name="label"
              type="text"
              placeholder="Cool label"
              fluid
            />
            <Message
              v-if="$form.label?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $form.label.error.message }}</Message
            >
          </div>
          <div class="flex flex-col gap-1 w-full">
            <div class="flex gap-1 w-full">
              <ColorPicker name="color" default-value="FF0000" format="hex" />
              <label for="color">Color</label>
            </div>
            <Message
              v-if="$form.color?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $form.color.error.message }}</Message
            >
          </div>

          <div class="card-actions w-full mt-4">
            <Button
              class="w-full"
              :loading="isLoading"
              label="Continue"
              type="submit"
            />
          </div>
        </Form>
      </div>
      <div v-else-if="boardDrawerStep === 5" class="space-y-6" data-step="5">
        <div class="flex items-center gap-2 justify-between">
          <h3 class="text-xl font-semibold">Members</h3>
          <Button
            icon="pi pi-plus"
            severity="secondary"
            size="small"
            @click="boardDrawerStep = 6"
          />
        </div>
        <div
          v-if="[...board.invitations, ...board.members].length > 0"
          class="flex flex-col gap-2 w-full"
        >
          <div
            v-for="(data, i) in [...board.invitations, ...board.members]"
            :key="data.id"
          >
            <div class="flex items-center gap-2">
              <Avatar :image="data.avatar" shape="circle" class="w-12 h-12" />
              <div class="flex flex-col gap-1 max-w-full">
                <span class="truncate">
                  {{ "full_name" in data ? data.full_name : data.email }}
                </span>
                <Tag
                  v-if="!('full_name' in data)"
                  value="Pending"
                  class="w-fit text-xs"
                  severity="secondary"
                  rounded
                />
              </div>
            </div>
            <div class="flex items-end justify-between gap-4 my-2">
              <div class="flex flex-col gap-1 w-full">
                <label for="role">Role</label>
                <Select
                  :default-value="data.role"
                  fluid
                  name="role"
                  option-value="value"
                  option-label="role"
                  :options="[
                    {
                      role: 'Reader',
                      description:
                        'User can only read this board and its content',
                      value: 'reader',
                    },
                    {
                      role: 'Member',
                      description: 'User can create and update cards',
                      value: 'member',
                    },
                    {
                      role: 'Administrator',
                      description: 'User has all permissions on this board',
                      value: 'admin',
                    },
                  ]"
                  @value-change="
                    (value) =>
                      'full_name' in data
                        ? updateMember(data.id, value)
                        : updateInvitation(data.id, value)
                  "
                >
                  <template #option="{ option }">
                    <div>
                      <p class="font-semibold">{{ option.role }}</p>
                      <p>{{ option.description }}</p>
                    </div>
                  </template>
                </Select>
              </div>
              <Button
                icon="pi pi-trash"
                icon-class="text-red-500"
                severity="secondary"
                rounded
                @click="
                  () =>
                    'full_name' in data
                      ? deleteMember(data.id)
                      : deleteMemberInvitation(data.id)
                "
              />
            </div>

            <Divider v-if="i !== board.invitations.length - 1" />
          </div>
        </div>
        <p v-else class="text-sm opacity-75 italic text-center">
          Nothing to show here.
          <br />
          Use the "+" button to invite someone to this board.
        </p>
      </div>
      <div v-else-if="boardDrawerStep === 6" class="space-y-6" data-step="6">
        <Form
          v-slot="$form"
          :resolver="
            ({ values }: FormResolverOptions) => {
              const errors: { [key: string]: { message: string }[] } = {};

              if (!values.email)
                errors.email = [{ message: 'Email is required' }];
              else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(values.email))
                errors.email = [{ message: 'Invalid email address' }];
              else if (
                board.invitations.find(
                  (invite) => invite.email === values.email,
                )
              )
                errors.email = [{ message: 'Invitation already exists' }];
              else if (
                board.members.find((member) => member.email === values.email)
              )
                errors.email = [
                  { message: 'User is already a member of this board' },
                ];
              if (!values.role) errors.role = [{ message: 'Role is required' }];

              return { errors };
            }
          "
          class="flex flex-col justify-center items-center gap-2 w-full"
          @submit="createInvitation"
        >
          <div class="flex flex-col gap-1 w-full">
            <label for="email">Email</label>
            <InputText
              name="email"
              type="text"
              placeholder="john.doe@boardstack.app"
              fluid
            />
            <Message
              v-if="$form.email?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.email.error.message }}
            </Message>
          </div>
          <div class="flex flex-col gap-1 w-full">
            <label for="role">Role</label>
            <Select
              name="role"
              placeholder="Member"
              :options="[
                {
                  role: 'Reader',
                  description: 'User can only read this board and its content',
                  value: 'reader',
                },
                {
                  role: 'Member',
                  description: 'User can create and update cards',
                  value: 'member',
                },
                {
                  role: 'Administrator',
                  description: 'User has all permissions on this board',
                  value: 'admin',
                },
              ]"
              option-label="role"
              option-value="value"
              fluid
            >
              <template #option="{ option }">
                <div>
                  <p class="font-semibold">{{ option.role }}</p>
                  <p>{{ option.description }}</p>
                </div>
              </template>
            </Select>
            <Message
              v-if="$form.role?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.role.error.message }}
            </Message>
          </div>

          <div class="card-actions w-full mt-4">
            <Button
              class="w-full"
              :loading="isLoading"
              label="Continue"
              type="submit"
            />
          </div>
        </Form>
      </div>
    </Transition>
  </Drawer>

  <LazyActivityExplorerDialog
    v-model:is-activity-dialog-open="isActivityDialogOpen"
    :board="board"
  />
</template>
