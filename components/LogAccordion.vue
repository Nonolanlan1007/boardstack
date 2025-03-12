<script setup lang="ts">
const props = defineProps<{
  logData: ActivityLog;
  index: number;
  board: DetailedBoard;
}>();

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
</script>

<template>
  <AccordionPanel :value="index">
    <AccordionHeader>
      <div class="flex items-center gap-2 w-full">
        <i :class="`pi ${selectIcon(logData.action)} mr-4`" />
        <Avatar :image="logData.avatar" shape="circle" class="aspect-square" />
        <div>
          <p class="w-full">
            <span class="font-bold">
              {{ logData.full_name }}
            </span>
            {{ selectAction(logData) }}
          </p>
          <span>{{ formatDate(logData.created_at, true) }}</span>
        </div>
      </div>
    </AccordionHeader>
    <AccordionContent v-if="logData.new_value || logData.old_value">
      <div class="flex gap-2">
        <i class="pi pi-minus text-red-500 text-sm m-2" />
        <span class="font-semibold whitespace-nowrap">Before:</span>
        <span v-if="logData.action === 'moved_card'" class="whitespace-nowrap">
          {{
            board.lists.find((l) => l.id === logData.old_value)
              ? board.lists.find((l) => l.id === logData.old_value)!.title
              : logData.old_value || "None"
          }}
        </span>
        <span
          v-else-if="logData.action === 'update_assigned_to_card'"
          class="whitespace-nowrap"
        >
          {{
            allMembers.find((m) => m.user_id === logData.old_value)
              ? allMembers.find((m) => m.user_id === logData.old_value)!
                  .full_name
              : logData.old_value || "None"
          }}
        </span>
        <span v-else class="whitespace-nowrap">
          {{ logData.old_value || "None" }}
        </span>
      </div>
      <div class="flex gap-2">
        <i class="pi pi-plus text-green-500 text-sm m-2" />
        <span class="font-semibold whitespace-nowrap">After:</span>
        <span v-if="logData.action === 'moved_card'" class="whitespace-nowrap">
          {{
            board.lists.find((l) => l.id === logData.new_value)
              ? board.lists.find((l) => l.id === logData.new_value)!.title
              : logData.new_value || "None"
          }}
        </span>
        <span
          v-else-if="logData.action === 'update_assigned_to_card'"
          class="whitespace-nowrap"
        >
          {{
            allMembers.find((m) => m.user_id === logData.new_value)
              ? allMembers.find((m) => m.user_id === logData.new_value)!
                  .full_name
              : logData.new_value || "None"
          }}
        </span>
        <span v-else class="whitespace-nowrap">
          {{ logData.new_value || "None" }}
        </span>
      </div>
    </AccordionContent>
    <AccordionContent v-else>
      <p>Details are unavailable.</p>
    </AccordionContent>
  </AccordionPanel>
</template>
