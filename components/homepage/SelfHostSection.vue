<script setup lang="ts">
import TypeIt from "typeit";

onMounted(() => {
  new TypeIt("#terminal-typeit", {
    loop: true,
  })
    .type("mark@vps01:~$ ", { instant: true })
    .pause(500)
    .type("mkdir boardstack")
    .break()
    .pause(250)
    .type("mark@vps01:~$ ", { instant: true })
    .pause(500)
    .type("wget ")
    .type("https://boardstack.app/compose.yml", { instant: true })
    .type(" -q")
    .break()
    .pause(250)
    .type("mark@vps01:~$ ", { instant: true })
    .pause(500)
    .type("sudo docker compose up -d")
    .break()
    .pause(250)
    .type("[sudo] password for mark: ", { instant: true })
    .pause(1000)
    .break()
    .pause(500)
    .type(" ⠴ boardstack [⣿         ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠦ boardstack [⣿⣿        ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠧ boardstack [⣿⣿⣿       ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠇ boardstack [⣿⣿⣿⣿      ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠙ boardstack [⣿⣿⣿⣿      ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠹ boardstack [⣿⣿⣿⣿⣿     ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠼ boardstack [⣿⣿⣿⣿⣿⣿    ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠴ boardstack [⣿⣿⣿⣿⣿⣿⣿   ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠦ boardstack [⣿⣿⣿⣿⣿⣿⣿⣿  ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠧ boardstack [⣿⣿⣿⣿⣿⣿⣿⣿⣿ ⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠇ boardstack [⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠙ boardstack [⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠹ boardstack [⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠼ boardstack [⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ⠴ boardstack [⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿] Pulling", { instant: true })
    .pause(250)
    .delete(37, { instant: true })
    .type(" ✔ boardstack Pulled", { instant: true })
    .pause(250)
    .break()
    .type("[+] Running 0/1", { instant: true })
    .break()
    .type(" ⠙ Container boardstack  Creating", { instant: true })
    .pause(250)
    .delete(33, { instant: true })
    .type(" ⠼ Container boardstack  Starting", { instant: true })
    .pause(250)
    .delete(49, { instant: true })
    .type("[+] Running 1/1", { instant: true })
    .break()
    .type(" ✔ Container boardstack  Started", { instant: true })
    .break()
    .type("mark@vps01:~$ ", { instant: true })
    .pause(10000)
    .empty()
    .go();
});
</script>

<template>
  <section
    class="flex gap-36 flex-col lg:flex-row container py-72 items-center"
  >
    <div class="flex-1">
      <h2
        class="text-3xl lg:text-5xl font-bold text-surface-900 dark:text-surface-0 mb-4 lg:leading-normal"
      >
        Host your <span class="text-primary">own</span> instance
      </h2>
      <p class="text-balance">
        Take full control of your data and effortlessly host BoardStack for free
        on your own machine in just seconds, ensuring complete privacy and
        ownership.
      </p>
      <NuxtLink to="#">
        <Button label="Go to instructions" class="mt-4" />
      </NuxtLink>
    </div>
    <div class="flex-1">
      <div class="rounded-md bg-surface-800 w-full h-96 overflow-clip">
        <div
          class="flex items-center justify-between gap-4 px-4 py-2 bg-surface-700"
        >
          <div class="flex items-center gap-1">
            <span class="rounded-full h-3 w-3 bg-red-500 hover:opacity-80" />
            <span class="rounded-full h-3 w-3 bg-orange-500 hover:opacity-80" />
            <span class="rounded-full h-3 w-3 bg-green-500 hover:opacity-80" />
          </div>
          <p>root@vps01.boardstack.app</p>
          <div class="flex items-center gap-1">
            <span class="w-3" />
            <span class="w-3" />
            <span class="w-3" />
          </div>
        </div>
        <div class="p-4">
          <span id="terminal-typeit" />
        </div>
      </div>
    </div>
  </section>
</template>
