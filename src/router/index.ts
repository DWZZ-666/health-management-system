import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils'

// ==================== 布局组件 ====================
const AppLayout = () => import('@/components/layout/AppLayout.vue')

// ==================== 公共路由 ====================
const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
]

// ==================== 前台路由（含 Layout 包裹） ====================
const userRouteChildren: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '工作台', requiresAuth: true, icon: 'HomeFilled' },
  },
  {
    path: '/health-records',
    name: 'HealthRecords',
    component: () => import('@/views/health-records/index.vue'),
    meta: { title: '健康档案', requiresAuth: true, icon: 'Document' },
  },
  {
    path: '/questionnaire',
    name: 'Questionnaire',
    component: () => import('@/views/questionnaire/index.vue'),
    meta: { title: '风险评估问卷', requiresAuth: true, icon: 'Edit' },
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/report/index.vue'),
    meta: { title: '健康评估报告', requiresAuth: true, icon: 'DataAnalysis' },
  },
  {
    path: '/recommendation',
    name: 'Recommendation',
    component: () => import('@/views/recommendation/index.vue'),
    meta: { title: '健康方案推荐', requiresAuth: true, icon: 'Guide' },
  },
]

// ==================== 后台路由（管理员） ====================
const adminRouteChildren: RouteRecordRaw[] = [
  {
    path: '/admin',
    redirect: '/admin/dashboard',
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/dashboard/index.vue'),
    meta: { title: '管理后台', requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/users/index.vue'),
    meta: { title: '用户管理', requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/records',
    name: 'AdminRecords',
    component: () => import('@/views/admin/records/index.vue'),
    meta: { title: '健康档案管理', requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: () => import('@/views/admin/reports/index.vue'),
    meta: { title: '报告管理', requiresAuth: true, roles: ['admin'] },
  },
]

// ==================== 汇总全部路由 ====================
const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [...userRouteChildren, ...adminRouteChildren],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/not-found/index.vue'),
    meta: { title: '404', requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ==================== 路由守卫 ====================
const whiteList = ['/login']

router.beforeEach(async (to, _from, next) => {
  const token = getToken()

  if (token) {
    if (to.path === '/login') {
      next('/dashboard')
      return
    }

    const userStore = useUserStore()

    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo()
      } catch {
        userStore.resetState()
        next(`/login?redirect=${to.path}`)
        return
      }
    }

    // 角色权限校验
    if (to.meta.roles) {
      const requiredRoles = to.meta.roles as string[]
      const hasRole = requiredRoles.includes(userStore.userInfo!.role)
      if (!hasRole) {
        next('/dashboard')
        return
      }
    }

    next()
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router

/** 导出路由配置供侧边栏渲染 */
export { userRouteChildren, adminRouteChildren }
