<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          教师注册
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          加入我们，开启您的教学之旅
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <!-- 邮箱输入 -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">邮箱</label>
          <div class="mt-1">
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="请输入邮箱"
            />
          </div>
        </div>

        <!-- 图形验证码 -->
        <div>
          <label class="block text-sm font-medium text-gray-700">图形验证码</label>
          <div class="mt-1 flex space-x-2">
            <input
              v-model="formData.captcha"
              type="text"
              required
              class="appearance-none rounded-md relative block w-2/3 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="请输入验证码"
            />
            <div 
              class="w-1/3 h-10 border border-gray-300 rounded-md overflow-hidden cursor-pointer"
              v-html="captchaSvg"
              @click="refreshCaptcha"
            ></div>
          </div>
        </div>

        <!-- 获取邮箱验证码按钮 -->
        <div class="flex justify-end">
          <button
            type="button"
            :disabled="!canSendEmail || emailCodeSending"
            @click="sendEmailCode"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ emailCodeButtonText }}
          </button>
        </div>

        <!-- 邮箱验证码 -->
        <div>
          <label class="block text-sm font-medium text-gray-700">邮箱验证码</label>
          <div class="mt-1">
            <input
              v-model="formData.emailCode"
              type="text"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="请输入邮箱验证码"
            />
          </div>
        </div>

        <!-- 密码输入 -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
          <div class="mt-1">
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="请输入密码"
            />
          </div>
        </div>

        <!-- 确认密码 -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">确认密码</label>
          <div class="mt-1">
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="请再次输入密码"
            />
          </div>
        </div>

        <!-- 服务条款 -->
        <div class="flex items-center">
          <input
            id="terms"
            v-model="formData.agreeToTerms"
            type="checkbox"
            required
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="terms" class="ml-2 block text-sm text-gray-900">
            我已阅读并同意
            <a href="#" class="text-blue-600 hover:text-blue-500">服务条款</a>
            和
            <a href="#" class="text-blue-600 hover:text-blue-500">隐私政策</a>
          </label>
        </div>

        <!-- 注册按钮 -->
        <div>
          <button
            type="submit"
            :disabled="isSubmitting || !formData.agreeToTerms"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                class="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            {{ isSubmitting ? '注册中...' : '注册' }}
          </button>
        </div>

        <!-- 登录链接 -->
        <div class="text-sm text-center">
          <router-link
            to="/login"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            已有账号？立即登录
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const formData = ref({
      email: '',
      captcha: '',
      emailCode: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    })

    const captchaSvg = ref('')
    const isSubmitting = ref(false)
    const emailCodeSending = ref(false)
    const emailCodeCountdown = ref(0)

    // 计算属性：是否可以发送邮箱验证码
    const canSendEmail = computed(() => {
      return formData.value.email && 
             formData.value.captcha && 
             !emailCodeSending.value && 
             emailCodeCountdown.value === 0
    })

    // 计算属性：邮箱验证码按钮文字
    const emailCodeButtonText = computed(() => {
      if (emailCodeSending.value) return '发送中...'
      if (emailCodeCountdown.value > 0) return `${emailCodeCountdown.value}秒后重试`
      return '获取验证码'
    })

    // 获取图形验证码
    const refreshCaptcha = async () => {
      try {
        const response = await axios.get('/api/auth/captcha', {
          responseType: 'text'
        })
        captchaSvg.value = response.data
      } catch (error) {
        ElMessage.error('获取验证码失败')
      }
    }

    // 发送邮箱验证码
    const sendEmailCode = async () => {
      if (!formData.value.email) {
        ElMessage.warning('请输入邮箱')
        return
      }
      if (!formData.value.captcha) {
        ElMessage.warning('请输入图形验证码')
        return
      }

      emailCodeSending.value = true
      try {
        await axios.post('/api/auth/email-code', {
          email: formData.value.email,
          captcha: formData.value.captcha
        })
        ElMessage.success('验证码已发送')
        startEmailCodeCountdown()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '发送验证码失败')
        refreshCaptcha()
      } finally {
        emailCodeSending.value = false
      }
    }

    // 开始邮箱验证码倒计时
    const startEmailCodeCountdown = () => {
      emailCodeCountdown.value = 60
      const timer = setInterval(() => {
        emailCodeCountdown.value--
        if (emailCodeCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }

    // 处理注册
    const handleRegister = async () => {
      // 表单验证
      if (formData.value.password !== formData.value.confirmPassword) {
        ElMessage.error('两次输入的密码不一致')
        return
      }

      if (!formData.value.agreeToTerms) {
        ElMessage.warning('请阅读并同意服务条款和隐私政策')
        return
      }

      isSubmitting.value = true
      try {
        const response = await axios.post('/api/auth/register', {
          email: formData.value.email,
          password: formData.value.password,
          emailCode: formData.value.emailCode,
          role: 'teacher'
        })

        // 保存token和用户信息
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        ElMessage.success('注册成功')
        router.push('/profile/setup') // 教师注册后跳转到资料完善页面
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '注册失败')
      } finally {
        isSubmitting.value = false
      }
    }

    // 初始化时获取验证码
    refreshCaptcha()

    return {
      formData,
      captchaSvg,
      isSubmitting,
      emailCodeSending,
      canSendEmail,
      emailCodeButtonText,
      refreshCaptcha,
      sendEmailCode,
      handleRegister
    }
  }
}
</script>
