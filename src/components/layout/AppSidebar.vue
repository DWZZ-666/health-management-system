<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapsed"
    :collapse-transition="false"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409eff"
    router
  >
    <div class="logo">
      <span v-if="!collapsed" class="logo-text">健康管理系统</span>
      <span v-else class="logo-text-mini">HM</span>
    </div>

    <template v-for="route in menuRoutes" :key="route.path">
      <!-- 有子菜单 -->
      <el-sub-menu v-if="route.children && route.children.length" :index="route.path">
        <template #title>
          <el-icon v-if="route.meta?.icon">
            <component :is="route.meta.icon" />
          </el-icon>
          <span>{{ route.meta?.title }}</span>
        </template>
        <el-menu-item
          v-for="child in route.children"
          :key="child.path"
          :index="child.path"
        >
          {{ child.meta?.title }}
        </el-menu-item>
      </el-sub-menu>

      <!-- 单级菜单 -->
      <el-menu-item v-else :index="route.path">
        <el-icon v-if="route.meta?.icon">
          <component :is="route.meta.icon" />
        </el-icon>
        <template #title>{{ route.meta?.title }}</template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userRouteChildren, adminRouteChildren } from '@/router'

defineProps<{ collapsed: boolean }>()

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => {
  const routes = [...userRouteChildren]
  if (userStore.isAdmin) {
    // 将后台路由分组为子菜单
    routes.push({
      path: '/admin',
      meta: { title: '后台管理', icon: 'Setting' },
      children: adminRouteChildren.filter((r) => !r.path.endsWith('/admin') && r.path !== '/admin'),
    } as any)
  }
  return routes
})
</script>

<style scoped lang="scss">
.el-menu {
  border-right: none;
  height: 100%;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #263445;
  color: #fff;
  font-weight: 600;
  font-size: 18px;
  overflow: hidden;
}

.logo-text {
  white-space: nowrap;
}

.logo-text-mini {
  font-size: 16px;
  letter-spacing: 2px;
}
</style>
