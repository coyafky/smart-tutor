<template>
  <section class="min-h-screen bg-cover bg-center" style="background-image: url('https://www.loliapi.com/acg/')">
    <div class="w-full mx-auto max-w-xl flex flex-col justify-center min-h-screen">
      <div class="bg-white/90 backdrop-blur-sm rounded-xl p-8">
        <!-- Starts component -->
        <div>
          <form
            class="w-full divide-neutral-200  p-8 lg:p-10"
            @submit.prevent="register"
          >
            <div class="py-2 space-y-3">
              <label for="username" class="block text-sm text-gray-700">Username</label>
              <input
                type="text"
                id="username"
                v-model="username"
                class="block w-full h-12 px-4 py-3 placeholder-gray-500 bg-gray-100 border-0 rounded-lg appearance-none text-blue-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-blue-500 focus:ring-inset focus:ring-2 text-xs"
                placeholder="Enter your username"
                required
              />
            </div>

           

            <div class="py-2 space-y-3">
              <label for="password" class="block text-sm text-gray-700">Password</label>
              <div class="relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="password"
                  class="block w-full h-12 px-4 py-3 placeholder-gray-500 bg-gray-100 border-0 rounded-lg appearance-none text-blue-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-blue-500 focus:ring-2 focus:ring-inset text-xs"
                  placeholder="Enter your password"
                  required
                />
                <span
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-xs text-gray-400 cursor-pointer"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </span>
              </div>
              <p class="text-gray-500 text-xs mt-1 lg:text-pretty">
                Password must contain at least one capital letter and a special character.
              </p>
            </div>

            <div class="py-2 space-y-3">
              <label for="confirmPassword" class="block text-sm text-gray-700">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                v-model="confirmPassword"
                class="block w-full h-12 px-4 py-3 placeholder-gray-500 bg-gray-100 border-0 rounded-lg appearance-none text-blue-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-blue-500 focus:ring-2 focus:ring-inset text-xs"
                placeholder="Confirm your password"
                required
              />
              <p v-if="!passwordsMatch" class="text-red-500 text-xs mt-1">
                Passwords do not match
              </p>
            </div>

            <div class="mt-4">
              <button
                type="submit"
                class="rounded-full bg-blue-600 px-8 py-2 h-12 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
              >
                Register
              </button>
            </div>
          </form>
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">Already have an account? 
              <router-link to="/login" class="text-blue-600 hover:text-blue-500 font-medium">Login here</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const passwordPattern = /^(?=.*[A-Z])(?=.*\W).+$/;

const passwordsMatch = computed(() => {
  return password.value === confirmPassword.value;
});

const register = () => {
  if (!passwordsMatch.value) {
    alert('Passwords do not match');
    return;
  }
  
  if (!passwordPattern.test(password.value)) {
    alert('Password does not meet requirements');
    return;
  }

  alert('Registration successful!');
};
</script>

<style scoped>
/* Custom styles if needed */
</style>
