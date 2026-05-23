<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary"><el-icon><Plus /></el-icon>新增用户</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="8">
        <el-input v-model="searchKeyword" placeholder="搜索用户名/昵称/手机号" clearable />
      </el-col>
      <el-col :span="4">
        <el-select v-model="roleFilter" placeholder="角色筛选" clearable>
          <el-option label="普通用户" value="user" />
          <el-option label="管理员" value="admin" />
        </el-select>
      </el-col>
    </el-row>

    <el-table :data="filteredUsers" stripe v-loading="loading" empty-text="暂无用户数据">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="100" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="role" label="角色" width="80">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : ''" size="small">
            {{ row.role === 'admin' ? '管理员' : '用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="120" />
      <el-table-column label="操作" fixed="right" width="160">
        <template #default>
          <el-button type="primary" link size="small">编辑</el-button>
          <el-button type="warning" link size="small">重置密码</el-button>
          <el-button type="danger" link size="small">禁用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="10"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import type { UserInfo } from '@/types'

const appStore = useAppStore()

const loading = ref(false)
const searchKeyword = ref('')
const roleFilter = ref('')
const page = ref(1)
const total = ref(0)

// Mock 用户数据
const users = ref<UserInfo[]>([
  { id: 1, username: 'admin', nickname: '系统管理员', avatar: '', email: 'admin@health.com', phone: '13800001111', gender: 'male', age: 35, role: 'admin', createdAt: '2025-01-01' },
  { id: 2, username: 'zhangsan', nickname: '张三', avatar: '', email: 'zhangsan@example.com', phone: '13800002222', gender: 'male', age: 45, role: 'user', createdAt: '2025-03-15' },
  { id: 3, username: 'lisi', nickname: '李四', avatar: '', email: 'lisi@example.com', phone: '13800003333', gender: 'female', age: 52, role: 'user', createdAt: '2025-02-20' },
  { id: 4, username: 'wangwu', nickname: '王五', avatar: '', email: 'wangwu@example.com', phone: '13800004444', gender: 'male', age: 28, role: 'user', createdAt: '2025-04-10' },
  { id: 5, username: 'zhaoliu', nickname: '赵六', avatar: '', email: 'zhaoliu@example.com', phone: '13800005555', gender: 'female', age: 61, role: 'user', createdAt: '2025-05-05' },
])

const filteredUsers = computed(() => {
  let list = users.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter((u) => u.username.includes(kw) || u.nickname.includes(kw) || u.phone.includes(kw))
  }
  if (roleFilter.value) {
    list = list.filter((u) => u.role === roleFilter.value)
  }
  total.value = list.length
  return list
})

onMounted(() => {
  appStore.setPageTitle('用户管理')
  total.value = users.value.length
})
</script>
