<template>
  <div>
    <HomeView />
    <FeaturesSection />
    <RoleChoose />
    <Footer />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import FeaturesSection from './components/FeaturesSection.vue';
import HomeView from './components/HomeView.vue';
import RoleChoose from './components/RoleChoose.vue';
import Footer from './components/Footer.vue';
</script>
