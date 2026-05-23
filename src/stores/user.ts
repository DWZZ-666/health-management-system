import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginParams } from '@/types'
import { loginApi, getUserInfoApi, logoutApi } from '@/api/auth'
import { setToken, getToken, clearAuth, setLocalUserInfo, getLocalUserInfo } from '@/utils'
import { ElMessage } from 'element-plus'
import router from '@/router'

export const useUserStore = defineStore(
  'user',
  () => {
    // ---- State ----
    const token = ref<string | null>(getToken())
    const userInfo = ref<UserInfo | null>(getLocalUserInfo())

    // ---- Getters ----
    const isLoggedIn = computed(() => !!token.value)
    const isAdmin = computed(() => userInfo.value?.role === 'admin')
    const userId = computed(() => userInfo.value?.id ?? 0)
    const nickname = computed(() => userInfo.value?.nickname ?? '')

    // ---- Actions ----

    /** 登录 */
    async function login(params: LoginParams): Promise<boolean> {
      try {
        const res = await loginApi(params)
        token.value = res.data.token
        userInfo.value = res.data.userInfo
        setToken(res.data.token)
        setLocalUserInfo(res.data.userInfo)
        ElMessage.success(`欢迎回来，${res.data.userInfo.nickname}`)
        return true
      } catch (e: any) {
        ElMessage.error(e.message || '登录失败')
        return false
      }
    }

    /** 获取用户信息 */
    async function fetchUserInfo(): Promise<void> {
      try {
        const res = await getUserInfoApi()
        userInfo.value = res.data
        setLocalUserInfo(res.data)
      } catch {
        // 静默失败，降级使用本地缓存的用户信息
      }
    }

    /** 登出 */
    async function logout(): Promise<void> {
      try {
        await logoutApi()
      } finally {
        token.value = null
        userInfo.value = null
        clearAuth()
        router.push('/login')
        ElMessage.info('已退出登录')
      }
    }

    /** 清除状态（路由守卫使用） */
    function resetState(): void {
      token.value = null
      userInfo.value = null
      clearAuth()
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      isAdmin,
      userId,
      nickname,
      login,
      fetchUserInfo,
      logout,
      resetState,
    }
  },
  {
    // 持久化到 localStorage
    persist: {
      key: 'user-store',
      storage: localStorage,
      paths: ['token', 'userInfo'],
    },
  },
)
