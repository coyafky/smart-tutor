<template>
  <footer class="bg-gradient-to-b from-gray-50 to-white">
    <div class="container mx-auto px-4 py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
        <!-- Brand Section -->
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-900">Smart Tutor</h2>
          <p class="text-base leading-relaxed text-gray-600 dark:text-gray-300">
            我们致力于为每位学生提供最优质的教育资源
          </p>
        </div>

        <!-- Quick Links -->
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-gray-900">快速链接</h3>
          <nav class="space-y-3">
            <a href="#" class="block text-base text-gray-600 hover:text-gray-900 ">首页</a>
            <a href="#" class="block text-base text-gray-600 hover:text-gray-900 ">关于我们</a>
            <a href="#" class="block text-base text-gray-600 hover:text-gray-900 ">服务</a>
            <a href="#" class="block text-base text-gray-600 hover:text-gray-900 ">联系我们</a>
          </nav>
        </div>

        <!-- Contact Info -->
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-gray-900 ">联系我们</h3>
          <div class="space-y-3 text-base text-gray-600 ">
            <p>123 创新街</p>
            <p>科技城, TC 12345</p>
            <p>电话: (123) 456-7890</p>
            <p>邮箱: hello@example.com</p>
          </div>
        </div>

        <!-- Newsletter -->
        <div class="space-y-6">
          <h3 class="text-xl font-semibold text-gray-900 ">订阅新闻</h3>
          <form class="flex gap-3">
            <input
              type="email"
              placeholder="输入您的邮箱"
              class="flex-1 px-4 py-3 rounded-xl border  dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              class="px-6 py-3 bg-blue-600 text-white  hover:bg-blue-700 transition-colors"
            >
              订阅
            </button>
          </form>
        </div>
      </div>

      <!-- Copyright -->
      <div class="mt-12 pt-8 border-t border-gray-200">
        <p class="text-sm text-center text-gray-600 ">
          © 2024 Smart Tutor. 保留所有权利。
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
/* 自定义样式 */
</style>
