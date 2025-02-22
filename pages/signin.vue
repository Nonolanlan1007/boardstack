<script setup lang="ts">
import type { FormSubmitEvent } from "@primevue/forms";
import CustomIcon from "~/components/CustomIcon.vue";

definePageMeta({
  middleware: "guest-only",
});

useHead({
  title: "Sign in to BoardStack",
});

const toast = useToast();
const route = useRoute();

const { redirectTo } = route.query
const isLoading = ref<boolean>(false);

function resolver({ values }: FormSubmitEvent) {
  const errors: { [key: string]: { message: string }[] } = {};

  if (!values.email) errors.email = [{ message: "Email is required" }];
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(values.email))
    errors.email = [{ message: "Invalid email address" }];
  if (!values.password) errors.password = [{ message: "Password is required" }];

  return { errors };
}

async function onSubmit({ valid, states }: FormSubmitEvent) {
  if (valid) {
    isLoading.value = true;
    try {
      await $fetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({
          email: states.email.value,
          password: states.password.value,
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
      <template #content>
        <div class="flex items-center justify-center flex-col gap-4">
          <div class="flex items-center justify-center flex-col gap-2">
            <CustomIcon icon="logo" class="h-8 w-8" />
            <h1 class="text-xl font-semibold">Welcome back!</h1>
            <p>Don't have an account? <UiLink :to="`/signup${redirectTo ? '?redirectTo=' + redirectTo : ''}`">Sign Up</UiLink></p>
          </div>

          <Form
            v-slot="$form"
            :resolver
            class="flex flex-col justify-center items-center gap-2 w-full"
            @submit="onSubmit"
          >
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
              <div class="flex items-center justify-between w-full gap-2">
                <label for="password">Password</label>
                <UiLink to="/forgot_password">Forgot your password?</UiLink>
              </div>
              <Password
                name="password"
                placeholder="Your password"
                fluid
                toggle-mask
                :feedback="false"
              />
              <Message
                v-if="$form.password?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.password.error.message }}</Message
              >
            </div>
            <CheckboxGroup name="rememberMe" class="w-full">
              <div class="flex w-full items-center gap-2 mt-2">
                <Checkbox input-id="rememberMe" value="Remember Me" />
                <label for="rememberMe">Remember me</label>
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

          <Divider align="center" type="solid">
            <b>OR</b>
          </Divider>

          <Button
            class="w-full"
            :loading="isLoading"
            icon="pi pi-key"
            label="Sign In with passkey"
            variant="outlined"
            @click="
              () => {
                toast.add({
                  severity: 'warn',
                  summary: 'Warning',
                  detail: 'Passkey login is not available yet',
                });
              }
            "
          />

          <p class="text-xs text-center mt-3">
            By signing in, you agree to our
            <UiLink to="/terms">Terms of Service</UiLink> and our
            <UiLink to="/privacy">Privacy Policy</UiLink>.
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>
