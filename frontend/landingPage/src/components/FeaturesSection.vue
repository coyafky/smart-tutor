<template>
  <section
    id="features-section"
    class="relative min-h-screen bg-gradient-to-b from-gray-50 to-white"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-12 sm:mb-20">
        <h2
          class="text-2xl sm:text-4xl font-bold text-gray-900 mb-4"
          :class="{
            'translate-y-0 opacity-100': isFeaturesVisible,
            'translate-y-8 opacity-0': !isFeaturesVisible,
          }"
        >
          系统特点
        </h2>
        <p
          class="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto"
          :class="{
            'translate-y-0 opacity-100': isFeaturesVisible,
            'translate-y-8 opacity-0': !isFeaturesVisible,
          }"
        >
          我们致力于为每位学生提供最优质的教育资源
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 lg:gap-12">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 transform"
          :class="{
            'translate-y-0 opacity-100': isFeaturesVisible,
            'translate-y-8 opacity-0': !isFeaturesVisible,
          }"
        >
          <div class="mb-4 sm:mb-6">
            <img
              :src="feature.image"
              :alt="feature.title"
              class="w-full h-40 sm:h-48 object-cover rounded-lg mb-4"
            />
            <component
              :is="feature.icon"
              class="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 mb-4 mx-auto"
            />
            <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-sm sm:text-base text-gray-600">
              {{ feature.description }}
            </p>
          </div>
          <button
            @click="navigateToDetail(feature.path)"
            class="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            了解更多
          </button>
        </div>
      </div>

      <!-- 向下滚动按钮 -->
      <button
        @click="scrollToNextSection"
        class="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 group animate-float"
        aria-label="滚动到下一部分"
      >
        <div
          class="p-3 sm:p-4 rounded-full bg-blue-500/10 backdrop-blur-sm group-hover:bg-blue-500/20 transition-all duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 sm:h-6 sm:w-6 transform group-hover:translate-y-0.5 transition-transform duration-300 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isFeaturesVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isFeaturesVisible.value = true;
  }, 500);
});

const features = [
  {
    icon: 'ChartBarIcon',
    title: '智能匹配',
    description:
      '运用先进的算法，基于学生的学习需求和教师的专业特长，提供最优的匹配推荐。',
    image: '/src/assets/images/matching.jpg',
    path: '/feature/matching',
  },
  {
    icon: 'AcademicCapIcon',
    title: '个性化学习',
    description: '根据学生的学习进度和掌握程度，定制专属的学习计划和内容推荐。',
    image: '/src/assets/images/learning.jpg',
    path: '/feature/learning',
  },
  {
    icon: 'LightBulbIcon',
    title: '实时反馈',
    description:
      '通过数据分析，及时反馈学习效果，帮助学生和教师更好地调整教学策略。',
    image: '/src/assets/images/feedback.jpg',
    path: '/feature/feedback',
  },
];

const scrollToNextSection = () => {
  const nextSection = document.getElementById('role-section');
  if (nextSection) {
    nextSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } else {
    console.error('无法找到目标 section');
  }
};

const navigateToDetail = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.animate-float {
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
