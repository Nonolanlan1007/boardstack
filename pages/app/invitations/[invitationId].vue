<script setup lang="ts">
definePageMeta({
  middleware: "auth-only",
});

const route = useRoute();
const colorMode = useColorMode();
const toast = useToast();

const { user, fetchUser } = useUserStore();

await callOnce(async () => await fetchUser());

const { data: invitationData, error: invitationFetchError } = useFetch(
  `/api/invitations/${route.params.invitationId}`,
);
if (invitationFetchError.value && invitationFetchError.value.statusCode === 404)
  throw createError({
    statusCode: 404,
    message: "Invitation Not Found",
  });

const backgroundColor = computed(() => {
  if (invitationData.value)
    return getBackgroundColor(invitationData.value.board_background);
  else return "";
});
const isLoading = ref<boolean>(false);

if (invitationData.value && invitationData.value.board_background)
  isImageLight(invitationData.value.board_background).then(
    (value) => (colorMode.value = value ? "light" : "dark"),
  );

async function acceptInvitation() {
  if (!invitationData.value) return;

  isLoading.value = true;
  try {
    await $fetch(
      `/api/boards/${invitationData.value.parent_board}/invitations/${invitationData.value.id}`,
      {
        method: "POST",
      },
    );
    isLoading.value = false;
  } catch (e: Error) {
    isLoading.value = false;
    return toast.add({
      severity: "error",
      summary: "Error",
      detail: e.message,
    });
  }

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Invitation accepted",
  });

  await navigateTo(`/app/boards/${invitationData.value.parent_board}`);
}

async function rejectInvitation() {
  if (!invitationData.value) return;

  isLoading.value = true;
  try {
    await $fetch(
      `/api/boards/${invitationData.value.parent_board}/invitations/${invitationData.value.id}`,
      {
        method: "DELETE",
      },
    );
    isLoading.value = false;
  } catch (e: Error) {
    isLoading.value = false;
    return toast.add({
      severity: "error",
      summary: "Error",
      detail: e.message,
    });
  }

  toast.add({
    severity: "success",
    summary: "Success",
    detail: "Invitation rejected",
  });

  await navigateTo(`/app`);
}
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen"
    :class="
      cn(
        'flex min-h-screen',
        invitationData && invitationData!.board_background_type === 'image'
          ? 'bg-center bg-no-repeat bg-cover bg-fixed'
          : backgroundColor,
      )
    "
    :style="
      invitationData && invitationData!.board_background_type === 'image'
        ? `background-image: url('${invitationData!.board_background}'); :`
        : ''
    "
  >
    <Card>
      <template v-if="invitationData" #content>
        <div
          class="flex items-center justify-center min-h-1/2 flex-col max-w-96 gap-4"
        >
          <div>
            <h1 class="text-3xl font-bold text-center mb-2">
              You have been invited to join {{ invitationData.board_title }}
            </h1>
            <h2 class="text-sm text-center">
              You're signed in as
              {{ user ? user.full_name : "Unknown" }}
            </h2>
          </div>

          <p class="w-full mt-2">You will be able to:</p>
          <div class="p-4 rounded bg-surface-200 dark:bg-surface-800 w-full">
            <div class="flex items-center gap-2">
              <i class="pi pi-check-circle text-primary" />
              <span>Read the content of the board</span>
            </div>
            <div
              v-if="['member', 'admin'].includes(invitationData.role)"
              class="flex items-center gap-2"
            >
              <i class="pi pi-check-circle text-primary" />
              <span>Create, update and delete cards and labels</span>
            </div>
            <div
              v-if="invitationData.role === 'admin'"
              class="flex items-center gap-2"
            >
              <i class="pi pi-check-circle text-primary" />
              <span>Update the board (title, members, etc)</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="pi pi-times-circle text-surface-400" />
              <span>Delete the board</span>
            </div>
          </div>

          <div class="flex items-center gap-2 justify-between flex-col w-full">
            <Button
              class="w-full"
              label="Accept"
              :loading="isLoading"
              @click="acceptInvitation"
            />
            <Button
              class="w-full"
              label="Reject"
              variant="outlined"
              :loading="isLoading"
              @click="rejectInvitation"
            />
          </div>
        </div>
      </template>
      <template
        v-else-if="
          invitationFetchError && invitationFetchError.statusCode === 403
        "
        #content
      >
        <div
          class="flex items-center justify-center min-h-1/2 flex-col max-w-96 gap-4"
        >
          <i class="pi pi-exclamation-circle text-4xl" />
          <div>
            <h1 class="text-3xl font-bold text-center mb-2">
              This invitation is not addressed to your account
            </h1>
            <h2 class="text-sm text-center">
              You're signed in as {{ user!.full_name }}
            </h2>
          </div>

          <NuxtLink to="/app" class="w-full">
            <Button class="w-full" label="Open BoardStack" />
          </NuxtLink>
        </div>
      </template>
    </Card>

    <div
      v-if="invitationData && invitationData.board_background_credits"
      class="flex items-center gap-1 fixed bottom-4 right-4 text-xs text-white rounded bg-black bg-opacity-10 p-1 select-none"
    >
      <a
        :href="invitationData.board_background_credits.split(',')[1]"
        class="underline hover:opacity-75 transition"
        target="_blank"
      >
        {{ invitationData.board_background_credits.split(",")[0] }}
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
  </div>
</template>
