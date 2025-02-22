<script setup lang="ts">
const model = defineModel<string>("value");
const props = defineProps<{ defaultValue?: string; class?: string }>();
const emit = defineEmits(["submit"]);

model.value = props.defaultValue || "";
const oldValue = ref<string>(model.value);

function submit() {
  model.value = model.value!.trim();
  if (model.value === oldValue.value) return;
  if (model.value === "") model.value = oldValue.value;
  else {
    emit("submit", model.value);
    oldValue.value = model.value;
  }
}
</script>

<template>
  <InputText
    v-model="model"
    unstyled
    :class="
      cn(
        'bg-transparent focus:border-primary outline-none border border-transparent hover:border-[var(--p-inputtext-hover-border-color)] p-1 transition rounded',
        props.class,
      )
    "
    :maxlength="20"
    @focusout="submit"
    @keyup.enter="submit"
  />
</template>
