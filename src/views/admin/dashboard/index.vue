<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">管理后台</h2>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.label">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: card.bgColor }">
              <el-icon :size="28"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-text">
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-value">{{ card.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">最近评估报告</span></template>
          <el-table :data="recentReports" stripe size="small">
            <el-table-column prop="user" label="用户" />
            <el-table-column prop="score" label="综合评分" width="100">
              <template #default="{ row }">
                <el-tag :type="row.score >= 70 ? 'success' : 'warning'" size="small">{{ row.score }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="等级" width="80" />
            <el-table-column prop="date" label="日期" width="120" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span class="card-title">系统公告</span></template>
          <el-timeline>
            <el-timeline-item v-for="(notice, idx) in notices" :key="idx" :timestamp="notice.time" placement="top">
              {{ notice.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { User, Document, DataAnalysis, TrendCharts } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('管理后台')
})

const statCards = [
  { label: '用户总数', value: '1,286', icon: User, bgColor: '#409eff' },
  { label: '健康档案', value: '3,420', icon: Document, bgColor: '#67c23a' },
  { label: '评估报告', value: '2,156', icon: DataAnalysis, bgColor: '#e6a23c' },
  { label: '本月新增', value: '138', icon: TrendCharts, bgColor: '#f56c6c' },
]

const recentReports = [
  { user: '张三', score: 78, level: '良好', date: '2025-06-18' },
  { user: '李四', score: 62, level: '一般', date: '2025-06-17' },
  { user: '王五', score: 91, level: '优秀', date: '2025-06-16' },
  { user: '赵六', score: 45, level: '较差', date: '2025-06-15' },
]

const notices = [
  { time: '2025-06-18', content: '系统升级至v2.0版本，新增AI风险评估算法' },
  { time: '2025-06-10', content: '新增心理健康评估模块，欢迎使用' },
  { time: '2025-06-01', content: '平台注册用户突破1000人' },
]
</script>

<style scoped lang="scss">
.stat-card {
  margin-bottom: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-text {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
}

.card-title {
  font-weight: 600;
}
</style>
