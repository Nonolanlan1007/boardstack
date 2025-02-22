<script setup lang="ts">
const cursors = ref([
  { id: 2, x: 150, y: 250, image: "/cursors/youssef.png" },
  { id: 0, x: 96, y: 12, image: "/cursors/barbara.png" },
]);
const card = ref();
const interval = ref<NodeJS.Timeout | null>(null);

function startAnimation() {
  const updatePositions = () => {
    if (!card.value) return;

    cursors.value = cursors.value.map((cursor) => ({
      ...cursor,
      ...{
        x: Math.random() * (card.value.rootEl.clientWidth - 32),
        y: Math.random() * (card.value.rootEl.clientHeight - 32),
      },
    }));
  };

  updatePositions();
  interval.value = setInterval(updatePositions, 1500);
}

function stopAnimation() {
  if (interval.value) {
    clearInterval(interval.value);
    interval.value = null;
  }
}
</script>

<template>
  <Card
    ref="card"
    class="flex-1 min-w-80 h-80 relative overflow-clip group"
    style="
      cursor:
        url(/cursors/you.png) 12 12,
        auto;
    "
    @mouseenter="startAnimation()"
    @mouseleave="stopAnimation()"
  >
    <template #title>
      <h3 class="text-center text-xl font-semibold">Real-time collaboration</h3>
      <p class="text-sm text-center text-balance">
        Work together seamlessly with your team members in real-time
      </p>
    </template>

    <template #content>
      <div
        v-for="cursor in cursors"
        :key="cursor.id"
        :style="{
          position: 'absolute',
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          height: '26px',
          width: `${77 - cursor.id}px`,
          backgroundImage: `url(${cursor.image})`,
          backgroundSize: 'contain',
          transform: 'translate(-50%, -50%)',
          transition: 'all 1s ease',
          pointerEvents: 'none',
          zIndex: 50,
          scale: interval === null ? 0 : 1,
        }"
      />

      <span
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 group-hover:h-48 group-hover:w-48 rounded-full bg-primary blur-3xl transition-all duration-200"
      />

      <div
        class="absolute bottom-4 -left-10 flex items-center justify-center gap-4"
      >
        <Card
          class="w-48 h-15 hover:bg-opacity-30 cursor-pointer bg-surface-400 dark:bg-black bg-opacity-15 dark:bg-opacity-15 backdrop-blur p-4 rounded-md select-none"
          unstyled
          style="
            cursor:
              url(/cursors/you.png) 12 12,
              auto;
          "
        >
          <template #content>Add /users route</template>
          <template #footer>
            <div class="flex items-center gap-2 flex-wrap mt-1">
              <i class="pi pi-align-left text-xs opacity-75" />
              <Tag
                v-for="label in [{ id: 1, label: 'API', color: '#3fb902' }]"
                :key="label.id"
                severity="contrast"
                :style="`background: ${label.color};`"
              >
                <span class="text-xs">{{ label.label }}</span>
              </Tag>
            </div>
          </template>
        </Card>
        <Card
          class="w-48 h-15 hover:bg-opacity-30 cursor-pointer bg-surface-400 dark:bg-black bg-opacity-15 dark:bg-opacity-15 backdrop-blur p-4 rounded-md select-none"
          unstyled
          style="
            cursor:
              url(/cursors/you.png) 12 12,
              auto;
          "
        >
          <template #content>Write Terms of Service</template>
          <template #footer>
            <div class="flex items-center gap-2 flex-wrap mt-1">
              <i class="pi pi-align-left text-xs opacity-75" />
              <Tag
                v-for="label in [{ id: 1, label: 'Label', color: '#FF0000' }]"
                :key="label.id"
                severity="contrast"
                :style="`background: transparent;`"
              >
                <span class="text-xs text-transparent">{{ label.label }}</span>
              </Tag>
            </div>
          </template>
        </Card>
      </div>
      <div
        class="absolute bottom-28 -left-32 flex items-center justify-center gap-4"
      >
        <Card
          class="w-52 h-15 hover:bg-opacity-30 cursor-pointer bg-surface-400 dark:bg-black bg-opacity-15 dark:bg-opacity-15 backdrop-blur p-4 rounded-md select-none"
          unstyled
          style="
            cursor:
              url(/cursors/you.png) 12 12,
              auto;
          "
        >
          <template #content>Task 1</template>
          <template #footer>
            <div class="flex items-center gap-2 flex-wrap mt-1">
              <i class="pi pi-align-left text-xs opacity-75" />
              <Tag
                v-for="label in [{ id: 1, label: 'Label', color: '#FF0000' }]"
                :key="label.id"
                severity="contrast"
                :style="`background: ${label.color};`"
              >
                <span class="text-xs">{{ label.label }}</span>
              </Tag>
            </div>
          </template>
        </Card>
        <Card
          class="w-52 h-15 hover:bg-opacity-30 cursor-pointer bg-surface-400 dark:bg-black bg-opacity-15 dark:bg-opacity-15 backdrop-blur p-4 rounded-md select-none"
          unstyled
          style="
            cursor:
              url(/cursors/you.png) 12 12,
              auto;
          "
        >
          <template #content>Internal Server Error</template>
          <template #footer>
            <div class="flex items-center gap-2 flex-wrap mt-1">
              <i class="pi pi-align-left text-xs opacity-75" />
              <Tag
                v-for="label in [
                  { id: 1, label: 'Bug', color: '#ff6200' },
                  { id: 2, label: 'Urgent', color: '#ffcc00' },
                ]"
                :key="label.id"
                severity="contrast"
                :style="`background: ${label.color};`"
              >
                <span class="text-xs">{{ label.label }}</span>
              </Tag>
            </div>
          </template>
        </Card>
        <Card
          class="w-48 h-15 hover:bg-opacity-30 cursor-pointer bg-surface-400 dark:bg-black bg-opacity-15 dark:bg-opacity-15 backdrop-blur p-4 rounded-md select-none"
          unstyled
          style="
            cursor:
              url(/cursors/you.png) 12 12,
              auto;
          "
        >
          <template #content>Create a footer</template>
          <template #footer>
            <div class="flex items-center gap-2 flex-wrap mt-1">
              <Tag
                v-for="label in [
                  { id: 1, label: 'Feature Request', color: '#ff00fb' },
                ]"
                :key="label.id"
                severity="contrast"
                :style="`background: ${label.color};`"
              >
                <span class="text-xs">{{ label.label }}</span>
              </Tag>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </Card>
</template>
