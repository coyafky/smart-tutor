<template>
  <div
    id="role-section"
    class="min-h-screen flex flex-col items-center justify-center bg-gray-100"
    :class="{ 'is-visible': isVisible }"
  >
    <!-- 标题 -->
    <h1 class="text-3xl font-bold mb-8">请选择您的角色</h1>

    <!-- 卡片容器 -->
    <div
      class="flex flex-col space-y-8 md:flex-row md:space-x-8 md:space-y-0 max-w-screen-md justify-center px-4"
    >
      <!-- 管理员卡片 -->
      <div
        class="w-72 bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:shadow-md hover:-translate-y-1"
        :class="{ 'ring-2 ring-blue-500/50': selectedRole === 'admin' }"
        @click="selectRole('admin')"
      >
        <img
          src="https://via.placeholder.com/300"
          alt="管理员"
          class="w-full h-40 object-cover"
        />
        <div class="p-4">
          <h2 class="text-xl font-semibold">管理员</h2>
          <p class="text-gray-600 mt-2">管理平台用户和内容，维护平台秩序。</p>
        </div>
      </div>

      <!-- 家长卡片 -->
      <div
        class="w-72 bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:shadow-md hover:-translate-y-1"
        :class="{ 'ring-2 ring-blue-500/50': selectedRole === 'parent' }"
        @click="selectRole('parent')"
      >
        <img
          src="https://via.placeholder.com/300"
          alt="家长"
          class="w-full h-40 object-cover"
        />
        <div class="p-4">
          <h2 class="text-xl font-semibold">家长</h2>
          <p class="text-gray-600 mt-2">
            发布求教需求，查看教师反馈，与教师交流。
          </p>
        </div>
      </div>

      <!-- 教师卡片 -->
      <div
        class="w-72 bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:shadow-md hover:-translate-y-1"
        :class="{ 'ring-2 ring-blue-500/50': selectedRole === 'tutor' }"
        @click="selectRole('tutor')"
      >
        <img
          src="https://via.placeholder.com/300"
          alt="教师"
          class="w-full h-40 object-cover"
        />
        <div class="p-4">
          <h2 class="text-xl font-semibold">教师</h2>
          <p class="text-gray-600 mt-2">
            浏览求教帖子，与家长交流，记录学习情况。
          </p>
        </div>
      </div>
    </div>

    <!-- 确认按钮 -->
    <button
      v-if="selectedRole"
      @click="confirmRole"
      class="mt-8 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
    >
      确认选择
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const selectedRole = ref('');
const isVisible = ref(false);

const roleUrls = {
  admin: 'http://localhost:5003',
  parent: 'http://localhost:5001',
  tutor: 'http://localhost:5002',
};

const selectRole = (role) => {
  selectedRole.value = role;
};

const confirmRole = () => {
  if (selectedRole.value && roleUrls[selectedRole.value]) {
    window.location.href = roleUrls[selectedRole.value];
  }
};

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<style scoped>
#role-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

#role-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
