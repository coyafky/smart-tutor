<template>
  <div>
    <HomeView />
    <FeaturesSection />
    <RoleChoose />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import FeaturesSection from './components/FeaturesSection.vue';
import HomeView from './components/HomeView.vue';
import RoleChoose from './components/RoleChoose.vue';
</script>
