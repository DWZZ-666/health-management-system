<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
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

    <el-table :data="pagedUsers" stripe v-loading="loading" empty-text="暂无用户数据">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="100" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="role" label="角色" width="80">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : ''" size="small">
            {{ row.role === 'admin' ? '管理员' : '用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="filteredUsers.length"
      layout="total, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
    />

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑用户' : '新增用户'" width="520px" :close-on-click-modal="false">
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!!editId" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" :prop="editId ? '' : 'password'">
          <el-input v-model="form.password" placeholder="请输入密码（编辑时留空不修改）" type="password" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi } from '@/api/admin'
import { formatDate } from '@/utils'
import type { UserInfo } from '@/types'

const appStore = useAppStore()
const loading = ref(false)
const searchKeyword = ref('')
const roleFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const users = ref<UserInfo[]>([])
const dialogVisible = ref(false)
const editId = ref<number | null>(null)
const formRef = ref()

const defaultForm = {
  username: '',
  nickname: '',
  password: '',
  email: '',
  phone: '',
  role: 'user' as string,
}

const form = reactive({ ...defaultForm })

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const filteredUsers = computed(() => {
  let list = users.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(u =>
      u.username.includes(kw) || u.nickname.includes(kw) || u.phone.includes(kw)
    )
  }
  if (roleFilter.value) {
    list = list.filter(u => u.role === roleFilter.value)
  }
  return list
})

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

function openDialog(row?: UserInfo) {
  editId.value = null
  if (row) {
    editId.value = row.id
    Object.assign(form, {
      username: row.username,
      nickname: row.nickname,
      password: '',
      email: row.email,
      phone: row.phone,
      role: row.role,
    })
  } else {
    Object.assign(form, defaultForm)
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const payload: any = {
    nickname: form.nickname,
    email: form.email,
    phone: form.phone,
    role: form.role,
  }

  if (form.password) {
    payload.password = form.password
  }

  try {
    if (editId.value) {
      await updateUserApi(editId.value, payload)
      ElMessage.success('用户信息已更新')
    } else {
      payload.username = form.username
      if (!form.password) {
        ElMessage.warning('请输入密码')
        return
      }
      await createUserApi(payload)
      ElMessage.success('用户已创建')
    }
    dialogVisible.value = false
    await fetchUsers()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该用户？此操作不可恢复', '提示', { type: 'warning' })
    await deleteUserApi(id)
    ElMessage.success('已删除')
    await fetchUsers()
  } catch {
    // 取消
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsersApi()
    users.value = res.data.sort((a, b) => a.id - b.id)
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  appStore.setPageTitle('用户管理')
  fetchUsers()
})
</script>
