<template>
  <main class="bg-surface-0 dark:bg-surface-950">
    <NavBar />

    <header class="flex lg:flex-row flex-col gap-4">
      <div class="flex-1 flex items-center justify-center">
        <div class="p-6 pt-12 lg:p-12 lg:!pl-32">
          <h1
            class="text-3xl lg:text-5xl font-bold text-surface-900 dark:text-surface-0 mb-4 lg:leading-normal text-center lg:text-left"
          >
            Create boards to
            <br />
            <span id="header-typeit" class="text-primary" />
          </h1>
          <p
            class="text-surface-700 dark:text-surface-200 leading-normal mb-8 text-center lg:text-left text-balance"
          >
            BoardStack lets you create customized boards to organize your
            projects and collaborate easily, all in a simple and simple and
            flexible.
          </p>
          <div class="flex items-center justify-center lg:justify-start gap-6">
            <Button label="Get Started" />
            <Button label="See more" outlined />
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-hidden">
        <NuxtImg
          src="/images/home_header_image.png"
          alt="Board example"
          format="webp"
          class="h-full w-full object-cover lg:[clip-path:polygon(12%_0,100%_0%,100%_100%,0_100%)]"
        />
      </div>
    </header>

    <section class="flex gap-4 flex-wrap container py-72">
      <div class="flex gap-4 flex-wrap w-full">
        <RealTimeCard />
        <GitHubIntegrationCard />
        <div class="flex-1 min-w-80 h-80 bg-surface-500" />
      </div>
      <div class="flex gap-4 flex-wrap w-full">
        <div class="flex-1 min-w-80 h-80 bg-surface-500" />
        <div class="flex-1 min-w-80 h-80 bg-surface-500" />
        <div class="flex-1 min-w-80 h-80 bg-surface-500" />
      </div>
    </section>

    <SelfHostSection />

    <div class="px-6 py-20 md:px-12 lg:px-20">
      <div
        class="text-surface-900 dark:text-surface-0 font-bold text-4xl lg:text-6xl mb-6 text-center"
      >
        Pricing Plans
      </div>
      <div
        class="text-surface-700 dark:text-surface-0/70 text-xl mb-12 text-center leading-normal"
      >
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Velit numquam
        eligendi quos.
      </div>
      <div
        class="flex lg:flex-row flex-col gap-8 lg:gap-4 xl:gap-12 max-w-7xl mx-auto"
      >
        <PrincingCard
          title="Free"
          description="A desc"
          :price="0"
          :is-per-user="false"
          :items="[
            { label: 'Up to 250Mo of file storage', included: true },
            { label: 'Up to 3 boards', included: true },
            { label: 'Up to 3 users per board', included: true },
          ]"
        />
        <PrincingCard
          title="Basic"
          description="A desc"
          :price="2"
          :is-per-user="false"
          :items="[
            { label: 'Up to 1Go of file storage', included: true },
            { label: 'Up to 10 boards', included: true },
            { label: 'Up to 10 users per board', included: true },
            { label: 'Priority support', included: true },
          ]"
        />
        <PrincingCard
          title="Teams"
          description="A desc"
          :price="3"
          is-per-user
          :items="[
            { label: 'Unlimited users', included: true },
            { label: 'Up to 5Go of file storage', included: true },
            { label: 'Unlimited board members', included: true },
            { label: 'Unlimited boards', included: true },
            { label: 'Special board permissions', included: true },
            { label: 'Priority support', included: true },
          ]"
        />
      </div>
      <div class="flex items-center justify-center flex-col">
        <p class="text-center text-xs opacity-75">
          Transactions are managed by Lemon Squeezy
        </p>
        <NuxtLink to="/pricing">
          <Button
            outlined
            label="Learn More"
            class="mt-4"
            icon-pos="right"
            icon="pi pi-arrow-up-right"
          />
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import TypeIt from "typeit";
import RealTimeCard from "~/components/homepage/RealTimeCard.vue";
import SelfHostSection from "~/components/homepage/SelfHostSection.vue";
import GitHubIntegrationCard from "~/components/homepage/GitHubIntegrationCard.vue";

onMounted(() => {
  new TypeIt("#header-typeit", {
    loop: true,
  })
    .type("organize your tasks")
    .pause(1000)
    .delete()
    .pause(100)
    .type("manage your project")
    .pause(1000)
    .delete()
    .pause(100)
    .type("note your ideas")
    .pause(1000)
    .delete()
    .pause(100)
    .go();
});
</script>
