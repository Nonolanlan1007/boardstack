<script setup lang="ts">
const isActivityDialogOpen = defineModel<boolean>("isActivityDialogOpen");
const props = defineProps<{ board: DetailedBoard }>();

const route = useRoute();
const toast = useToast();

const logs = ref<ActivityLog[]>([]);
const logsCount = ref<number>(0);
const firstElement = ref<number>(0);
const isLoading = ref<boolean>(false);
const userFilter = ref<any>();
const actionFilter = ref<any>();

const allActions = ref([
  {
    label: "Board Renamed",
    value: "rename_board",
  },
  {
    label: "Background Updated",
    value: "update_board_background",
  },
  {
    label: "Card Created",
    value: "card_created",
  },
  {
    label: "Card Deleted",
    value: "card_deleted",
  },
  {
    label: "Card Renamed",
    value: "renamed_card",
  },
  {
    label: "Card Description Updated",
    value: "update_card_description",
  },
  {
    label: "Card Moved",
    value: "moved_card",
  },
  {
    label: "Update Assigned User",
    value: "update_assigned_to_card",
  },
]);

const allMembers = computed(() => [
  {
    user_id: props.board.owner.id,
    full_name: props.board.owner.full_name,
    avatar: props.board.owner.avatar,
  },
  ...props.board.members,
]);

function selectAction(log: ActivityLog) {
  const parent_card = props.board.lists
    .flatMap((l) => l.cards)
    .find((c) => c.id === log.parent_card_id);

  switch (log.action) {
    case "rename_board":
      return "renamed the board";
    case "update_board_background":
      return "updated the background";
    case "card_created":
      return `created a card in list '${props.board.lists.find((l) => l.id === log.linked_value)!.title}'`;
    case "card_deleted":
      return `deleted a card from list '${props.board.lists.find((l) => l.id === log.linked_value)!.title}'`;
    case "renamed_card":
      return `renamed a card`;
    case "update_card_description":
      return `updated the description of card '${props.board.lists.flatMap((l) => l.cards).find((c) => c.id === log.parent_card_id)!.title}'`;
    case "moved_card":
      return parent_card ? `moved card '${parent_card.title}'` : "moved a card";
    case "update_assigned_to_card": {
      const member = allMembers.value.find((l) => l.user_id === log.new_value);
      return parent_card
        ? `assigned ${member ? member.full_name : "nobody"} to card '${parent_card!.title}'`
        : `assigned ${member ? member.full_name : "nobody"} to a card`;
    }
    default:
      return "did an unknown action";
  }
}

function selectIcon(action: string) {
  switch (action) {
    case "rename_board":
      return "pi-pen-to-square";
    case "update_board_background":
      return "pi-image";
    case "card_created":
      return "pi-file-plus";
    case "card_deleted":
      return "pi-trash";
    case "renamed_card":
      return "pi-pen-to-square";
    case "update_card_description":
      return "pi-align-left";
    case "moved_card":
      return "pi-arrows-alt";
    case "update_assigned_to_card":
      return "pi-user-edit";
    default:
      return "pi-wrench";
  }
}

async function refresh() {
  const urlParams = new URLSearchParams({
    ...(userFilter.value && { created_by: userFilter.value.user_id }),
    ...(actionFilter.value && { action: actionFilter.value.value }),
    count: 50,
    start: firstElement.value,
  });

  isLoading.value = true;
  const res = await fetch(
    `/api/boards/${route.params.boardId}/activity?${urlParams.toString()}`,
  );

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
  logsCount.value = data.total;

  isLoading.value = false;
}
</script>

<template>
  <Drawer
    v-model:visible="isActivityDialogOpen"
    position="full"
    @show="refresh"
  >
    <div class="container">
      <div class="flex items-center justify-between gap-2 mb-4">
        <h1 class="text-3xl font-bold">Activity</h1>
        <div class="flex items-center gap-2">
          <!--<IconField>
            <InputText
              placeholder="Search"
              fluid
              @focusout=""
              @keyup.enter=""
            />
            <InputIcon v-if="!isLoading" class="pi pi-search" />
            <InputIcon v-else class="pi pi-spin pi-spinner" />
          </IconField>-->
          <Select
            v-model:model-value="actionFilter"
            name="user"
            placeholder="Filter by action"
            :options="allActions"
            show-clear
            :disabled="isLoading"
            filter
            :filter-fields="['label']"
            @value-change="refresh"
          >
            <template #option="{ option }">
              <div class="flex items-center">
                <i :class="`pi ${selectIcon(option.value)} mr-2`" />
                <p>{{ option.label }}</p>
              </div>
            </template>
            <template #value="{ value }">
              <div v-if="value" class="flex items-center">
                <i :class="`pi ${selectIcon(value.value)} mr-2`" />
                <p>{{ value.label }}</p>
              </div>
            </template>
          </Select>
          <Select
            v-model:model-value="userFilter"
            name="user"
            placeholder="Filter by user"
            :options="allMembers"
            show-clear
            :disabled="isLoading"
            @value-change="refresh"
          >
            <template #option="{ option }">
              <div class="flex items-center">
                <Avatar
                  v-if="option.avatar"
                  :image="option.avatar"
                  shape="circle"
                  class="!h-6 !w-6 mr-1"
                />
                <p>{{ option.full_name }}</p>
              </div>
            </template>
            <template #value="{ value }">
              <div v-if="value" class="flex items-center">
                <Avatar
                  :image="value.avatar"
                  shape="circle"
                  class="!h-6 !w-6 mr-1"
                />
                <p>{{ value.full_name }}</p>
              </div>
            </template>
          </Select>
        </div>
      </div>
      <div v-if="!isLoading && logs.length > 0">
        <Accordion v-if="!isLoading && logs.length > 0">
          <AccordionPanel
            v-for="(log, index) in logs"
            :key="index"
            :value="index"
          >
            <AccordionHeader>
              <span class="flex items-center gap-2 w-full">
                <i :class="`pi ${selectIcon(log.action)} mr-4`" />
                <Avatar :image="log.avatar" shape="circle" />
                <span>
                  <span class="flex items-center gap-2 w-full">
                    <span class="font-bold whitespace-nowrap">
                      {{ log.full_name }}
                    </span>
                    <span>
                      {{ selectAction(log) }}
                    </span>
                  </span>
                  <span>{{ formatDate(log.created_at, true) }}</span>
                </span>
              </span>
            </AccordionHeader>
            <AccordionContent v-if="log.new_value || log.old_value">
              <div class="flex gap-2">
                <i class="pi pi-minus text-red-500 text-sm m-2" />
                <span class="font-semibold whitespace-nowrap">Before:</span>
                <span
                  v-if="log.action === 'moved_card'"
                  class="whitespace-nowrap"
                >
                  {{
                    board.lists.find((l) => l.id === log.old_value)
                      ? board.lists.find((l) => l.id === log.old_value)!.title
                      : log.old_value || "None"
                  }}
                </span>
                <span
                  v-else-if="log.action === 'update_assigned_to_card'"
                  class="whitespace-nowrap"
                >
                  {{
                    allMembers.find((m) => m.user_id === log.old_value)
                      ? allMembers.find((m) => m.user_id === log.old_value)!
                          .full_name
                      : log.old_value || "None"
                  }}
                </span>
                <span v-else class="whitespace-nowrap">
                  {{ log.old_value || "None" }}
                </span>
              </div>
              <div class="flex gap-2">
                <i class="pi pi-plus text-green-500 text-sm m-2" />
                <span class="font-semibold whitespace-nowrap">After:</span>
                <span
                  v-if="log.action === 'moved_card'"
                  class="whitespace-nowrap"
                >
                  {{
                    board.lists.find((l) => l.id === log.new_value)
                      ? board.lists.find((l) => l.id === log.new_value)!.title
                      : log.new_value || "None"
                  }}
                </span>
                <span
                  v-else-if="log.action === 'update_assigned_to_card'"
                  class="whitespace-nowrap"
                >
                  {{
                    allMembers.find((m) => m.user_id === log.new_value)
                      ? allMembers.find((m) => m.user_id === log.new_value)!
                          .full_name
                      : log.new_value || "None"
                  }}
                </span>
                <span v-else class="whitespace-nowrap">
                  {{ log.new_value || "None" }}
                </span>
              </div>
            </AccordionContent>
            <AccordionContent v-else>
              <p>Details are unavailable.</p>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
        <Paginator
          v-model:first="firstElement"
          :rows="50"
          :total-records="logsCount"
          class="mb-8"
          :template="{
            '640px': 'PrevPageLink CurrentPageReport NextPageLink',
            '960px':
              'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink',
            '1300px':
              'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink',
            default:
              'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink',
          }"
          @page="refresh"
        />
      </div>
      <div
        v-else-if="!isLoading"
        class="flex items-center justify-center h-full"
      >
        <p>No results for the selected filters</p>
      </div>
      <div v-else class="flex items-center justify-center h-full">
        <i class="pi pi-spinner animate-spin" />
      </div>
    </div>
  </Drawer>
</template>
