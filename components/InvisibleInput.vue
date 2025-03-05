<script setup lang="ts">
const model = defineModel<string>("value");
const props = defineProps<{
  defaultValue?: string;
  class?: string;
  maxLength?: number;
  disabled?: boolean;
}>();
const emit = defineEmits(["submit"]);

if (props.defaultValue) model.value = props.defaultValue;
const oldValue = ref<string>(model.value || "");
const isEditorOpened = ref<boolean>(false);
const inputField = ref<HTMLInputElement>();

function submit() {
  if (props.disabled) return;
  model.value = model.value!.trim();
  isEditorOpened.value = false;
  if (model.value === oldValue.value) return;
  if (model.value === "") model.value = oldValue.value;
  else {
    emit("submit", model.value);
    oldValue.value = model.value;
  }
}

function openEditor() {
  if (!props.disabled) {
    isEditorOpened.value = true;
    setTimeout(() => inputField.value!.focus(), 100);
  }
}
</script>

<template>
  <div>
    <button
      v-show="!isEditorOpened"
      :class="
        cn(
          'bg-transparent focus:border-primary outline-none border border-transparent enabled:hover:border-[var(--p-inputtext-hover-border-color)] p-1 transition rounded cursor-text text-left select-text',
          props.class,
        )
      "
      :disabled="props.disabled"
      @click="openEditor"
    >
      {{ model }}
    </button>
    <input
      v-show="isEditorOpened && !disabled"
      ref="inputField"
      v-model="model"
      :class="
        cn(
          'bg-transparent focus:border-primary outline-none border border-transparent hover:border-[var(--p-inputtext-hover-border-color)] p-1 transition rounded',
          props.class,
        )
      "
      :maxlength="maxLength"
      @focusout="submit"
      @keyup.enter="submit"
    />
  </div>
</template>
