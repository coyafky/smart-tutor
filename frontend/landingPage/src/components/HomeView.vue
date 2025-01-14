<template>
  <div class="relative antialiased">
    <!-- 首屏部分 -->
    <section class="relative h-screen overflow-hidden">
      <!-- 全屏视频背景 -->
      <video
        autoplay
        muted
        loop
        playsinline
        class="absolute inset-0 w-full h-full object-cover"
      >
        <source src="../assets/video/start.mp4" type="video/mp4" />
        您的浏览器不支持视频播放。
      </video>

      <!-- 渐变遮罩 -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"
      ></div>

      <!-- 内容区域 -->
      <div
        class="relative h-full flex flex-col items-center justify-center text-white px-4"
      >
        <div
          class="text-center space-y-6 transform transition-all duration-700"
          :class="{
            'translate-y-0 opacity-100': isVisible,
            'translate-y-8 opacity-0': !isVisible,
          }"
        >
          <h1 class="text-5xl md:text-6xl font-bold tracking-tight">
            智能家教
            <span
              class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400"
            >
              推荐系统
            </span>
          </h1>
          <p
            class="text-xl md:text-2xl font-medium text-gray-200 max-w-2xl mx-auto leading-relaxed"
          >
            让学习更高效，让教育更智能
          </p>
        </div>

        <!-- 滚动按钮 -->
        <button
          @click="scrollToNextSection"
          class="absolute bottom-12 right-12 group animate-float"
          aria-label="滚动到下一部分"
        >
          <div
            class="p-4 rounded-full bg-blue-500/10 backdrop-blur-sm group-hover:bg-blue-500/20 transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 transform group-hover:translate-y-0.5 transition-transform duration-300 text-blue-500"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isVisible = ref(false);

const scrollToNextSection = () => {
  const nextSection = document.getElementById('features-section');
  if (nextSection) {
    nextSection.scrollIntoView({ behavior: 'smooth' });
  }
};

onMounted(() => {
  // 首屏动画
  setTimeout(() => {
    isVisible.value = true;
  }, 500);
});
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

/* Safari 视频优化 */
video {
  -webkit-mask-image: -webkit-radial-gradient(white, black);
  -webkit-backface-visibility: hidden;
  -moz-backface-visibility: hidden;
}

/* 渐变文字 */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 自定义动画延迟 */
.delay-200 {
  transition-delay: 200ms;
}
.delay-400 {
  transition-delay: 400ms;
}
.delay-600 {
  transition-delay: 600ms;
}

/* 确保视频覆盖 */
video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);
  z-index: -1;
}
</style>
