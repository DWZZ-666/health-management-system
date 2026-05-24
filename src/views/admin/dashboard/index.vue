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
          <el-table :data="recentReports" stripe size="small" v-loading="loading">
            <el-table-column prop="userName" label="用户" />
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
            <el-table-column prop="generatedAt" label="日期" width="120">
              <template #default="{ row }">{{ formatDate(row.generatedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewReport(row)">查看</el-button>
              </template>
            </el-table-column>
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

    <el-dialog v-model="detailVisible" title="报告详情" width="700px">
      <template v-if="selectedReport">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:48px;font-weight:700;color:#409eff">{{ selectedReport.overallScore }}</span>
          <span style="font-size:16px;color:#909399"> 分</span>
          <el-tag :type="levelTagType(selectedReport.overallLevel)" size="large" style="margin-left:12px;vertical-align:super">
            {{ levelLabel(selectedReport.overallLevel) }}
          </el-tag>
        </div>
        <p style="color:#606266;line-height:1.8;margin-bottom:20px">{{ selectedReport.summary }}</p>
        <el-divider content-position="left">健康维度</el-divider>
        <el-table :data="selectedReport.healthDimensions" size="small" stripe>
          <el-table-column prop="dimension" label="维度" width="120" />
          <el-table-column prop="score" label="评分" width="80">
            <template #default="{ r }">
              <el-tag :type="r.score >= 85 ? 'success' : r.score >= 70 ? '' : 'warning'" size="small">{{ r.score }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="80">
            <template #default="{ r }">{{ levelLabel(r.level) }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, Document, DataAnalysis, TrendCharts } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { getUsersApi, getHealthRecordsApi, getReportsApi } from '@/api/admin'
import { formatDate } from '@/utils'
import type { RiskReport } from '@/types'

interface ReportRow extends RiskReport {
  userName: string
}

const appStore = useAppStore()
const loading = ref(false)
const detailVisible = ref(false)
const selectedReport = ref<RiskReport | null>(null)

const statCards = ref([
  { label: '用户总数', value: '加载中...', icon: User, bgColor: '#409eff' },
  { label: '健康档案', value: '加载中...', icon: Document, bgColor: '#67c23a' },
  { label: '评估报告', value: '加载中...', icon: DataAnalysis, bgColor: '#e6a23c' },
  { label: '本月新增', value: '加载中...', icon: TrendCharts, bgColor: '#f56c6c' },
])

const recentReports = ref<ReportRow[]>([])

const notices = [
  { time: '2026-05-18', content: '系统升级至v2.0版本，新增AI风险评估算法' },
  { time: '2026-05-10', content: '新增心理健康评估模块，欢迎使用' },
  { time: '2026-05-01', content: '平台注册用户突破50人，感谢支持' },
]

function levelTagType(level: string): 'success' | 'warning' | 'danger' | '' {
  const map: Record<string, any> = { excellent: 'success', good: '', fair: 'warning', poor: 'danger' }
  return map[level] || ''
}

function levelLabel(level: string): string {
  const map: Record<string, string> = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }
  return map[level] || level
}

function viewReport(row: ReportRow) {
  const { userName: _, ...report } = row
  selectedReport.value = report as RiskReport
  detailVisible.value = true
}

async function loadStats() {
  loading.value = true
  try {
    const [usersRes, recordsRes, reportsRes] = await Promise.all([
      getUsersApi(),
      getHealthRecordsApi(),
      getReportsApi(),
    ])

    const users = usersRes.data
    const records = recordsRes.data
    const reports = reportsRes.data

    const now = new Date()
    const thisMonth = reports.filter(r => {
      const d = new Date(r.generatedAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    statCards.value = [
      { label: '用户总数', value: `${users.length}`, icon: User, bgColor: '#409eff' },
      { label: '健康档案', value: `${records.length}`, icon: Document, bgColor: '#67c23a' },
      { label: '评估报告', value: `${reports.length}`, icon: DataAnalysis, bgColor: '#e6a23c' },
      { label: '本月新增', value: `${thisMonth.length}`, icon: TrendCharts, bgColor: '#f56c6c' },
    ]

    const userMap = new Map(users.map(u => [u.id, u.nickname]))
    recentReports.value = reports
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, 5)
      .map(r => ({ ...r, userName: userMap.get(r.userId) || '未知用户' }))
  } catch {
    statCards.value.forEach(c => { c.value = '--' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  appStore.setPageTitle('管理后台')
  loadStats()
})
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
