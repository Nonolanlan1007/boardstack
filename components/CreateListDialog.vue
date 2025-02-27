<script setup lang="ts">
import type { FormSubmitEvent } from "@primevue/forms";

const isNewListModalOpen = defineModel<boolean>("isNewListModalOpen");
const props = defineProps<{ board: DetailedBoard }>();

const route = useRoute();
const toast = useToast();

const isLoading = ref<boolean>(false);

function createListResolver({ values }: FormSubmitEvent) {
  const errors: { [key: string]: { message: string }[] } = {};

  if (!values.title) errors.title = [{ message: "Title is required" }];

  return { errors };
}

async function createList({ states, valid }: FormSubmitEvent) {
  if (valid) {
    isLoading.value = true;
    const res = await fetch(
      `/api/boards/${route.params.boardId as string}/lists`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: states.title.value,
          parentBoard: props.board.id,
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

    isNewListModalOpen.value = false;

    toast.add({
      severity: "success",
      summary: "Success",
      detail: `List successfully created`,
      life: 3000,
    });
  }
}
</script>

<template>
  <Dialog
    v-model:visible="isNewListModalOpen"
    modal
    header="Create a new list"
    :style="{ width: '25vw' }"
    :breakpoints="{ '1199px': '50vw', '575px': '90vw' }"
    dismissable-mask
  >
    <Form
      v-slot="$form"
      class="flex flex-col justify-center items-center gap-2 w-full"
      :resolver="createListResolver"
      @submit="createList"
    >
      <div class="flex flex-col gap-1 w-full mb-2">
        <label for="title">Title</label>
        <InputText
          name="title"
          type="text"
          placeholder="My awesome list"
          fluid
          autofocus
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

      <div class="flex justify-end w-full mt-4">
        <Button
          type="submit"
          label="Continue"
          class="w-full md:w-min"
          :loading="isLoading"
        />
      </div>
    </Form>
  </Dialog>
</template>
