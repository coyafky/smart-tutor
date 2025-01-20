<template>
  <div class="w-screen h-screen">
    <div class="grid grid-cols-8 grid-rows-[auto_1fr] h-screen">
      <div class="col-span-8 h-16 bg-slate-600 text-white relative">
        <!-- Logo and System Name -->
        <div class="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center">
          <img 
            src="../assets/image/image.png" 
            class="w-10 h-10 mr-3"
            alt="System Logo"
          />
          <h1 class="text-xl font-bold">智能家教推荐系统</h1>
        </div>

        <!-- Right Side Controls -->
        <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-6">
          <!-- City Display -->
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>上海市</span>
          </div>

          <!-- Dropdown Menu -->
          <div class="relative">
            <button 
              class="flex items-center space-x-2 hover:bg-gray-700 px-3 py-2 rounded-md"
              @click="showDropdown = !showDropdown"
            >
              <img 
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" 
                class="w-8 h-8 rounded-full"
                alt="User Avatar"
              />
              <span>Admin</span>
              <svg 
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': showDropdown }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Content -->
            <div 
              v-if="showDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden"
            >
              <a 
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                账户设置
              </a>
              <button
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="handleLogout"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="col-span-2 bg-gray-800 text-white p-6 flex flex-col h-[calc(100vh-4rem)]">
        <!-- User Info Section -->
        <div class="flex items-center mb-8 p-4 bg-gray-700/50 rounded-xl">
          <div class="mr-4">
            <img 
              src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" 
              class="w-12 h-12 rounded-full"
              alt="Admin Avatar"
            />
          </div>
          <div>
            <p class="text-lg font-semibold">Admin</p>
            <p class="text-sm text-gray-300">admin@smarttutor.com</p>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="space-y-2 flex flex-col h-full">
          <div class="space-y-2 flex-grow overflow-y-auto pb-4">
          <a
            href="#"
            class="flex items-center px-4 py-3 text-base font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-200"
          >
            <svg
              class="mr-3 h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            用户管理
          </a>
          <a
            href="#"
            class="flex items-center px-4 py-3 text-base font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-200"
          >
            <svg
              class="mr-3 h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            帖子管理
          </a>
          <a
            href="#"
            class="flex items-center px-4 py-3 text-base font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-200"
          >
            <svg
              class="mr-3 h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            反馈管理
          </a>
          <a
            href="#"
            class="flex items-center px-4 py-3 text-base font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-all duration-200"
          >
            <svg
              class="mr-3 h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            系统设置
          </a>
          </div>
          <button
            class="sticky bottom-4 flex items-center px-4 py-3 text-base font-medium text-gray-300 hover:bg-red-600/90 hover:text-white rounded-lg transition-all duration-200 bg-gray-700/50"
            @click="handleLogout"
          >
            <svg
              class="mr-3 h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            登出
          </button>
        </nav>
      </aside>

      <div class="col-span-6 col-start-3 flex items-center justify-center bg-blue-500 text-black h-[calc(100vh-4rem)]">
        main
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showDropdown = ref(false);
const dropdownRef = ref(null);

const handleLogout = () => {
  if (confirm('确定要登出系统吗？')) {
    window.location.href = '/login';
  }
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
