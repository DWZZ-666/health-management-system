<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">报告管理</h2>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="8">
        <el-input v-model="searchKeyword" placeholder="搜索用户名" clearable />
      </el-col>
      <el-col :span="4">
        <el-select v-model="levelFilter" placeholder="评级筛选" clearable>
          <el-option label="优秀" value="excellent" />
          <el-option label="良好" value="good" />
          <el-option label="一般" value="fair" />
          <el-option label="较差" value="poor" />
        </el-select>
      </el-col>
    </el-row>

    <el-table :data="reports" stripe v-loading="loading" empty-text="暂无报告数据">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="userName" label="用户" width="100" />
      <el-table-column prop="overallScore" label="综合评分" width="100">
        <template #default="{ row }">
          <el-tag :type="row.overallScore >= 85 ? 'success' : row.overallScore >= 70 ? '' : 'warning'" size="small">
            {{ row.overallScore }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="overallLevel" label="等级" width="80">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.overallLevel)" size="small">{{ levelLabel(row.overallLevel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="generatedAt" label="生成时间" width="160" />
      <el-table-column label="操作" fixed="right" width="120">
        <template #default>
          <el-button type="primary" link size="small">详情</el-button>
          <el-button type="danger" link size="small">删除</el-button>
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
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const loading = ref(false)
const searchKeyword = ref('')
const levelFilter = ref('')
const page = ref(1)
const total = ref(0)

const reports = ref([
  { id: 1, userName: '张三', overallScore: 78, overallLevel: 'good', generatedAt: '2025-06-18 14:30:00' },
  { id: 2, userName: '李四', overallScore: 62, overallLevel: 'fair', generatedAt: '2025-06-17 09:15:00' },
  { id: 3, userName: '王五', overallScore: 91, overallLevel: 'excellent', generatedAt: '2025-06-16 16:45:00' },
  { id: 4, userName: '赵六', overallScore: 45, overallLevel: 'poor', generatedAt: '2025-06-15 11:20:00' },
])

function levelTagType(level: string): 'success' | 'warning' | 'danger' | '' {
  const map: Record<string, any> = { excellent: 'success', good: '', fair: 'warning', poor: 'danger' }
  return map[level] || ''
}

function levelLabel(level: string): string {
  const map: Record<string, string> = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }
  return map[level] || level
}

onMounted(() => {
  appStore.setPageTitle('报告管理')
  total.value = reports.value.length
})
</script>
