<script setup lang="ts">
import type { FormSubmitEvent } from "@primevue/forms";

const isNewCardModalOpen = defineModel<boolean>("isNewCardModalOpen");
const props = defineProps<{ board: DetailedBoard; initialValues: unknown }>();

const route = useRoute();
const toast = useToast();

const isLoading = ref<boolean>(false);

function createCardResolver({ values }: FormSubmitEvent) {
  const errors: { [key: string]: { message: string }[] } = {};

  if (!values.title) errors.title = [{ message: "Title is required" }];
  if (!values.parentList)
    errors.parentList = [{ message: "Parent List is required" }];

  return { errors };
}

async function createCard({ states, valid }: FormSubmitEvent) {
  if (valid) {
    isLoading.value = true;
    const res = await fetch(
      `/api/boards/${route.params.boardId as string}/cards`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: states.title.value,
          description: states.description.value
            ? states.description.value
            : null,
          parentList: states.parentList.value,
          labels:
            states.labels.value && states.labels.value.length > 0
              ? states.labels.value
              : undefined,
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

    const parentList = props.board.lists.find(
      (list) => list.id === states.parentList.value,
    )!;

    isNewCardModalOpen.value = false;

    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Card created in '${parentList.title}'`,
      life: 3000,
    });
  }
}
</script>

<template>
  <Dialog
    v-model:visible="isNewCardModalOpen"
    modal
    header="Create a new card"
    :style="{ width: '60vw' }"
    :breakpoints="{ '1199px': '90vw' }"
    dismissable-mask
  >
    <Form
      v-slot="$form"
      class="flex flex-col justify-center items-center gap-2 w-full"
      :resolver="createCardResolver"
      :initial-values="initialValues"
      @submit="createCard"
    >
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div class="md:col-span-4">
          <div class="flex flex-col gap-1 w-full mb-2">
            <label for="title">Title</label>
            <InputText
              name="title"
              type="text"
              placeholder="My awesome card"
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
            Description
            <Editor name="description" editor-style="height: 320px;" />
            <Message
              v-if="$form.description?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.description.error?.message }}
            </Message>
          </div>
        </div>
        <div class="md:col-span-2">
          <div class="flex flex-col gap-1 w-full mb-2">
            <label for="parentList">Parent list</label>
            <Select
              name="parentList"
              placeholder="Select a list"
              fluid
              :options="board.lists"
              option-label="title"
              option-value="id"
            />
            <Message
              v-if="$form.parentList?.invalid"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ $form.parentList.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1 w-full">
            <label for="labels">Labels</label>
            <MultiSelect
              display="chip"
              :options="board.labels"
              option-label="label"
              option-value="id"
              filter
              fluid
              placeholder="Select labels"
              name="labels"
              :max-selected-labels="2"
            />
          </div>
          <Message
            v-if="$form.labels?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.labels.error.message }}
          </Message>
        </div>
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
