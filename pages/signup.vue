<script setup lang="ts">
import type { FormSubmitEvent } from "@primevue/forms";
import CustomIcon from "~/components/CustomIcon.vue";

definePageMeta({
  middleware: "guest-only",
});

useHead({
  title: "Sign up to BoardStack",
});

const toast = useToast();
const config = useRuntimeConfig();
const route = useRoute();

const { redirectTo } = route.query
const isLoading = ref<boolean>(false);

function resolver({ values }: FormSubmitEvent) {
  const errors: { [key: string]: { message: string }[] } = {};

  if (!values.email) errors.email = [{ message: "Email is required" }];
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(values.email))
    errors.email = [{ message: "Invalid email address" }];
  if (!values.password) errors.password = [{ message: "Password is required" }];
  else if (values.password.length < 8)
    errors.password = [
      { message: "Password must be at least 8 characters long" },
    ];
  else if (values.password !== values.confirmPassword)
    errors.confirmPassword = [{ message: "Passwords do not match" }];
  if (!values.fullName) errors.fullName = [{ message: "Name is required" }];

  return { errors };
}

async function onSubmit({ valid, states }: FormSubmitEvent) {
  if (valid) {
    isLoading.value = true;
    try {
      await $fetch("/api/users/signup", {
        method: "POST",
        body: JSON.stringify({
          email: states.email.value,
          password: states.password.value,
          full_name: states.fullName.value,
        }),
      });
      isLoading.value = false;
    } catch (e: Error) {
      isLoading.value = false;
      return toast.add({
        severity: "error",
        summary: "Error",
        detail: e.message,
      });
    }

    const { fetch } = useUserSession();
    await fetch();

    await navigateTo(redirectTo as string ?? "/app");
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <Card>
      <template v-if="config.public.enableRegistration === 'true'" #content>
        <div class="flex items-center justify-center flex-col gap-4">
          <div class="flex items-center justify-center flex-col gap-2">
            <CustomIcon icon="logo" class="h-8 w-8" />
            <h1 class="text-xl font-semibold">Welcome back!</h1>
            <p>
              Already have an account? <UiLink :to="`/signin${redirectTo ? '?redirectTo=' + redirectTo : ''}`">Sign In</UiLink>
            </p>
          </div>

          <Form
            v-slot="$form"
            :resolver
            class="flex flex-col justify-center items-center gap-2 w-full"
            @submit="onSubmit"
          >
            <div class="flex flex-col gap-1 w-full">
              <label for="fullName">Full name</label>
              <InputText
                name="fullName"
                type="text"
                placeholder="Your full name"
                fluid
              />
              <Message
                v-if="$form.fullName?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.fullName.error.message }}</Message
              >
            </div>
            <div class="flex flex-col gap-1 w-full">
              <label for="email">Email address</label>
              <InputText
                name="email"
                type="text"
                placeholder="Your email address"
                fluid
              />
              <Message
                v-if="$form.email?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.email.error.message }}</Message
              >
            </div>
            <div class="flex flex-col gap-1 w-full">
              <label for="password">Password</label>
              <Password
                name="password"
                placeholder="Your password"
                fluid
                toggle-mask
              />
              <Message
                v-if="$form.password?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.password.error.message }}</Message
              >
            </div>
            <div class="flex flex-col gap-1 w-full">
              <label for="confirmPassword">Confirm Password</label>
              <Password
                name="confirmPassword"
                placeholder="Confirm password"
                fluid
                toggle-mask
                :feedback="false"
              />
              <Message
                v-if="$form.confirmPassword?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.confirmPassword.error.message }}</Message
              >
            </div>
            <CheckboxGroup name="newsletter" class="w-full">
              <div class="flex w-full items-center gap-2 mt-2">
                <Checkbox input-id="newsletter" value="Newsletter" />
                <label for="newsletter"
                  >Subscribe to BoardStack's newsletter</label
                >
              </div>
            </CheckboxGroup>

            <div class="card-actions w-full mt-4">
              <Button
                class="w-full"
                :loading="isLoading"
                label="Continue"
                type="submit"
              />
            </div>
          </Form>

          <p class="text-xs text-center mt-3">
            By signing up, you agree to our
            <UiLink to="/terms">Terms of Service</UiLink> and our
            <UiLink to="/privacy">Privacy Policy</UiLink>.
          </p>
        </div>
      </template>
      <template v-else #content>
        <div
          class="flex items-center justify-center min-h-1/2 flex-col max-w-96 gap-4"
        >
          <i class="pi pi-exclamation-circle text-4xl" />
          <h1 class="text-3xl font-bold text-center">
            Registrations are disabled
          </h1>
          <p class="text-center text-balance">
            Your administrator has disabled registrations on this instance. You
            can enable them by setting the
            <span class="p-1 rounded bg-surface-100 dark:bg-surface-700">
              ENABLE_REGISTRATION
            </span>
            environment variable to
            <span class="p-1 rounded bg-surface-100 dark:bg-surface-700">
              true
            </span>
          </p>
          <NuxtLink :to="`/signin${redirectTo ? '?redirectTo=' + redirectTo : ''}`" class="w-full">
            <Button class="w-full" label="Sign In" />
          </NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>
