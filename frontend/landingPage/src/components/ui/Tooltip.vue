<template>
  <div class="relative inline-block">
    <slot name="trigger"></slot>
    <transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="absolute z-50 mt-2 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg p-2 text-sm text-gray-700 dark:text-gray-200"
      >
        <slot name="content"></slot>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isVisible = ref(false);
</script>
