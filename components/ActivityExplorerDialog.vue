<script setup lang="ts">
const isActivityDialogOpen = defineModel<boolean>("isActivityDialogOpen");

const route = useRoute();

const { data: logs, error } = useFetch(
  `/api/boards/${route.params.boardId as string}/activity`,
);

if (error.value) throw error;

function selectAction(action: string) {
  switch (action) {
    case "rename_board":
      return "renamed the board";
    case "update_board_background":
      return "updated the background";
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
    default:
      return "pi-wrench";
  }
}
</script>

<template>
  <Drawer
    v-model:visible="isActivityDialogOpen"
    header="Activity"
    position="full"
  >
    <Accordion class="container">
      <AccordionPanel v-for="(log, index) in logs" :key="index" :value="index">
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
                  {{ selectAction(log.action) }}
                </span>
              </span>
              <span>{{ formatDate(log.created_at, true) }}</span>
            </span>
          </span>
        </AccordionHeader>
        <AccordionContent>
          <div class="flex gap-2">
            <i class="pi pi-minus text-red-500 text-sm m-2" />
            <span class="font-semibold whitespace-nowrap">Before:</span>
            <span class="whitespace-nowrap">{{ log.old_value || "None" }}</span>
          </div>
          <div class="flex gap-2">
            <i class="pi pi-plus text-green-500 text-sm m-2" />
            <span class="font-semibold whitespace-nowrap">After:</span>
            <span class="whitespace-nowrap">{{ log.new_value || "None" }}</span>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </Drawer>
</template>
