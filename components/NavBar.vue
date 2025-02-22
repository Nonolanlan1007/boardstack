<template>
  <MegaMenu
    :model="items"
    class="p-4 bg-surface-100 dark:bg-surface-800 lg:justify-between px-6 lg:mt-4 z-50 container left-1/2 -translate-x-1/2 lg:!fixed !rounded-none lg:!rounded-full !border-none lg:!border-1"
    style="border-radius: 3rem"
    :pt="{
      end: { class: '!ml-0' },
    }"
  >
    <template #start>
      <CustomIcon icon="logo" class="h-10 w-10" />
    </template>
    <template #item="{ item }">
      <NuxtLink
        v-if="item.route && !item.icon"
        class="flex items-center cursor-pointer px-4 py-2 overflow-hidden relative font-semibold text-lg uppercase"
        style="border-radius: 2rem"
        :to="item.route"
      >
        <span>{{ item.label }}</span>
      </NuxtLink>
      <a
        v-else-if="item.route"
        class="flex items-center p-4 cursor-pointer mb-2 gap-3"
        style="border-radius: 2rem"
        :href="item.route"
      >
        <span
          class="inline-flex items-center justify-center rounded-full bg-primary text-primary-contrast w-12 h-12"
        >
          <i :class="[item.icon, 'text-lg']" />
        </span>
        <span class="inline-flex flex-col gap-1">
          <span class="font-bold text-lg">{{ item.label }}</span>
          <span class="whitespace-nowrap">{{ item.subtext }}</span>
        </span>
      </a>
      <a
        v-else-if="item.root"
        class="flex items-center cursor-pointer px-4 py-2 overflow-hidden relative font-semibold text-lg uppercase"
        style="border-radius: 2rem"
      >
        <span>{{ item.label }}</span>
      </a>
      <a
        v-else-if="!item.image"
        class="flex items-center p-4 cursor-pointer mb-2 gap-3"
      >
        <span
          class="inline-flex items-center justify-center rounded-full bg-primary text-primary-contrast w-12 h-12"
        >
          <i :class="[item.icon, 'text-lg']" />
        </span>
        <span class="inline-flex flex-col gap-1">
          <span class="font-bold text-lg">{{ item.label }}</span>
          <span class="whitespace-nowrap">{{ item.subtext }}</span>
        </span>
      </a>
      <div v-else class="flex flex-col items-start gap-4 p-2">
        <NuxtImg
          :src="item.image"
          alt="BoardStack"
          format="webp"
          height="400"
          width="711"
          class="w-full rounded-md"
        />
        <span>{{ item.subtext }}</span>
        <Button :label="item.label as string" outlined />
      </div>
    </template>
    <template #end>
      <ClientOnly>
        <div
          class="p-1 rounded-full w-12 h-12 hover:bg-emphasis transition cursor-pointer mx-2 flex items-center justify-center"
          @click="colorMode = colorMode === 'light' ? 'dark' : 'light'"
        >
          <span :class="colorMode === 'light' ? 'pi pi-moon' : 'pi pi-sun'" />
        </div>
      </ClientOnly>
      <NuxtLink to="/signin">
        <Button rounded icon="pi pi-sign-in" label="Sign In" outlined />
      </NuxtLink>
      <!--<div
          class="p-1 rounded-full w-12 h-12 hover:bg-emphasis transition cursor-pointer mx-2 flex items-center justify-center"
        >
          <Avatar
            image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
            shape="circle"
          />
        </div>-->
    </template>
  </MegaMenu>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CustomIcon from "~/components/CustomIcon.vue";
import type { MenuItem } from "primevue/menuitem";

const colorMode = useColorMode();

const items = ref<MenuItem[]>([
  {
    label: "Product",
    root: true,
    items: [
      [
        {
          label: "Features",
          items: [
            {
              label: "GitHub integration",
              icon: "pi pi-github",
              subtext: "Sync your board with GitHub",
            },
            {
              label: "Real-time collaboration",
              icon: "pi pi-comments",
              subtext: "Work together in real-time",
            },
          ],
        },
      ],
      [
        {
          label: "Solutions",
          items: [
            {
              label: "Teams",
              icon: "pi pi-users",
              subtext: "Made for productive teams",
            },
            {
              label: "Developers",
              icon: "pi pi-code",
              subtext: "Tools built for developers",
            },
          ],
        },
      ],
      [
        {
          label: "BoardStack",
          items: [
            {
              label: "About Us",
              icon: "pi pi-info-circle",
              subtext: "Learn more about us",
            },
            {
              label: "Services Status",
              icon: "pi pi-database",
              subtext: "Check our system status",
            },
          ],
        },
      ],
      [
        {
          items: [
            {
              image: "/images/home_header_image.png",
              label: "Get Started",
              subtext: "Your next project starts here",
            },
          ],
        },
      ],
    ],
  },
  {
    label: "Pricing",
    root: true,
    route: "/pricing",
  },
  {
    label: "Ressources",
    root: true,
    items: [
      [
        {
          label: "Ressources",
          items: [
            {
              label: "Documentation",
              icon: "pi pi-book",
              subtext: "Explore our detailed guides",
            },
            {
              label: "API Docs",
              icon: "pi pi-server",
              subtext: "Access API documentation",
              route: "/api-docs/scalar",
            },
          ],
        },
      ],
      [
        {
          label: "Community",
          items: [
            {
              label: "Source code",
              icon: "pi pi-code",
              subtext: "Visit our GitHub repository",
            },
            {
              label: "Self-host",
              icon: "pi pi-server",
              subtext: "Host on your infrastructure",
            },
          ],
        },
      ],
      [
        {
          label: "Support",
          items: [
            {
              label: "Report an issue",
              icon: "pi pi-exclamation-triangle",
              subtext: "Help us improve",
            },
            {
              label: "Contact Us",
              icon: "pi pi-envelope",
              subtext: "Get help from experts",
            },
          ],
        },
      ],
      [
        {
          items: [
            {
              image: "/images/home_header_image.png",
              label: "Get Started",
              subtext: "Ready to transform your workflow?",
            },
          ],
        },
      ],
    ],
  },
]);
</script>
