<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">健康档案管理</h2>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="8">
        <el-input v-model="searchKeyword" placeholder="搜索用户名" clearable />
      </el-col>
    </el-row>

    <div class="table-responsive">
      <el-table :data="pagedRecords" stripe v-loading="loading" empty-text="暂无档案数据">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="userName" label="用户" width="100" />
      <el-table-column prop="bmi" label="BMI" width="80">
        <template #default="{ row }">
          <el-tag :type="row.bmi >= 18.5 && row.bmi < 24 ? 'success' : 'warning'" size="small">{{ row.bmi }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="血压" width="140">
        <template #default="{ row }">{{ row.systolicBP }}/{{ row.diastolicBP }} mmHg</template>
      </el-table-column>
      <el-table-column label="空腹血糖" width="100">
        <template #default="{ row }">{{ row.bloodSugar }} mmol/L</template>
      </el-table-column>
      <el-table-column label="总胆固醇" width="100">
        <template #default="{ row }">{{ row.totalCholesterol }} mmol/L</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="120">
        <template #default="{ row }">
          <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="filteredRecords.length"
      layout="total, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { getHealthRecordsApi, getUsersApi } from '@/api/admin'
import { deleteHealthRecordApi } from '@/api/healthRecord'
import { formatDate } from '@/utils'
import type { HealthRecord } from '@/types'

interface RecordRow extends HealthRecord {
  userName: string
}

const appStore = useAppStore()
const loading = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const records = ref<RecordRow[]>([])

const filteredRecords = computed(() => {
  if (!searchKeyword.value) return records.value
  const kw = searchKeyword.value.toLowerCase()
  return records.value.filter(r => r.userName.toLowerCase().includes(kw))
})

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该档案？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteHealthRecordApi(id)
    ElMessage.success('已删除')
    await fetchData()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function fetchData() {
  loading.value = true
  try {
    const [recordsRes, usersRes] = await Promise.all([
      getHealthRecordsApi(),
      getUsersApi(),
    ])
    const userMap = new Map(usersRes.data.map(u => [u.id, u.nickname]))
    records.value = recordsRes.data
      .map(r => ({ ...r, userName: userMap.get(r.userId) || '未知' }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  appStore.setPageTitle('健康档案管理')
  fetchData()
})
</script>
