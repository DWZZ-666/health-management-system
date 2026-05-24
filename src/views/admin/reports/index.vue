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

    <div class="table-responsive">
      <el-table :data="pagedReports" stripe v-loading="loading" empty-text="暂无报告数据">
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
      <el-table-column prop="generatedAt" label="生成时间" width="160">
        <template #default="{ row }">{{ formatDate(row.generatedAt, 'YYYY-MM-DD HH:mm') }}</template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="160">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="viewReport(row)">查看</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="filteredReports.length"
      layout="total, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
    />

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
            <template #default="{ row }">
              <el-tag :type="row.score >= 85 ? 'success' : row.score >= 70 ? '' : 'warning'" size="small">{{ row.score }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="80">
            <template #default="{ row }">{{ levelLabel(row.level) }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
        </el-table>
        <el-divider content-position="left">风险指标</el-divider>
        <el-row :gutter="12">
          <el-col :span="12" v-for="ind in selectedReport.riskIndicators" :key="ind.name" style="margin-bottom:12px">
            <el-card shadow="never" :class="['indicator-mini', `indicator-${ind.level}`]">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:600">{{ ind.name }}</span>
                <el-tag :type="ind.level === 'normal' ? 'success' : ind.level === 'borderline' ? 'warning' : 'danger'" size="small">
                  {{ ind.level === 'normal' ? '正常' : ind.level === 'borderline' ? '临界' : '异常' }}
                </el-tag>
              </div>
              <div style="font-size:22px;font-weight:700;margin:8px 0">
                {{ ind.value }} <span style="font-size:13px;color:#909399;font-weight:400">{{ ind.unit }}</span>
              </div>
              <div style="font-size:12px;color:#909399">
                正常范围：{{ ind.normalRange[0] }} - {{ ind.normalRange[1] }} {{ ind.unit }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { getReportsApi, getUsersApi, deleteReportApi } from '@/api/admin'
import { formatDate } from '@/utils'
import type { RiskReport } from '@/types'

interface ReportRow extends RiskReport {
  userName: string
}

const appStore = useAppStore()
const loading = ref(false)
const searchKeyword = ref('')
const levelFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const reports = ref<ReportRow[]>([])
const detailVisible = ref(false)
const selectedReport = ref<RiskReport | null>(null)

const filteredReports = computed(() => {
  let list = reports.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(r => r.userName.toLowerCase().includes(kw))
  }
  if (levelFilter.value) {
    list = list.filter(r => r.overallLevel === levelFilter.value)
  }
  return list
})

const pagedReports = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredReports.value.slice(start, start + pageSize.value)
})

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

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该报告？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteReportApi(id)
    ElMessage.success('已删除')
    await fetchData()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function fetchData() {
  loading.value = true
  try {
    const [reportsRes, usersRes] = await Promise.all([
      getReportsApi(),
      getUsersApi(),
    ])
    const userMap = new Map(usersRes.data.map(u => [u.id, u.nickname]))
    reports.value = reportsRes.data
      .map(r => ({ ...r, userName: userMap.get(r.userId) || '未知' }))
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
  } catch {
    reports.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  appStore.setPageTitle('报告管理')
  fetchData()
})
</script>

<style scoped lang="scss">
.indicator-mini {
  border-left: 4px solid #dcdfe6;
  &.indicator-normal { border-left-color: #67c23a; }
  &.indicator-borderline { border-left-color: #e6a23c; }
  &.indicator-abnormal { border-left-color: #f56c6c; }
}
</style>
