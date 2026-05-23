<template>
  <div class="report-container">
    <!-- 无报告时显示引导 -->
    <div v-if="!report" class="page-card" style="text-align:center;padding:60px">
      <el-empty description="暂无评估报告">
        <el-button type="primary" @click="router.push('/questionnaire')">
          立即评估
        </el-button>
      </el-empty>
    </div>

    <template v-else>
      <!-- 综合评分卡片 -->
      <el-card class="score-card" shadow="hover">
        <el-row :gutter="24" align="middle">
          <el-col :xs="24" :sm="8" style="text-align:center">
            <div class="overall-score-ring">
              <span class="score-number">{{ report.overallScore }}</span>
              <span class="score-unit">分</span>
            </div>
          </el-col>
          <el-col :xs="24" :sm="16">
            <div class="score-detail">
              <h2>综合健康评估：<el-tag :type="levelTagType" size="large">{{ levelLabel }}</el-tag></h2>
              <p class="summary-text">{{ report.summary }}</p>
              <p class="report-time">评估时间：{{ report.generatedAt }}</p>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 风险指标概览 -->
      <div class="chart-card">
        <div class="chart-title">健康风险指标</div>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :lg="8" v-for="indicator in report.riskIndicators" :key="indicator.name">
            <el-card :class="['indicator-card', `indicator-${indicator.level}`]" shadow="hover">
              <div class="indicator-header">
                <span class="indicator-name">{{ indicator.name }}</span>
                <el-tag :type="indicatorLevelTag(indicator.level)" size="small">{{ indicatorLevelLabel(indicator.level) }}</el-tag>
              </div>
              <div class="indicator-value">
                {{ indicator.value }}
                <span class="indicator-unit">{{ indicator.unit }}</span>
              </div>
              <div class="indicator-range">
                正常范围：{{ indicator.normalRange[0] }} - {{ indicator.normalRange[1] }} {{ indicator.unit }}
              </div>
              <div class="indicator-suggestions">
                <div v-for="(sug, si) in indicator.suggestions.slice(0, 3)" :key="si" class="suggestion-item">
                  <el-icon :size="14" color="#67c23a"><Check /></el-icon>
                  {{ sug }}
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 雷达图：健康维度评估 -->
      <div class="chart-card">
        <div class="chart-title">健康维度雷达图</div>
        <div ref="radarChartRef" class="chart-box"></div>
      </div>

      <!-- 柱状图：各维度评分 -->
      <div class="chart-card">
        <div class="chart-title">健康维度评分对比</div>
        <div ref="barChartRef" class="chart-box"></div>
      </div>

      <!-- 折线图：指标趋势 -->
      <div class="chart-card">
        <div class="chart-title">健康指标趋势（近6个月）</div>
        <div ref="lineChartRef" class="chart-box"></div>
      </div>

      <!-- 健康维度详情 -->
      <div class="chart-card">
        <div class="chart-title">各维度详细分析</div>
        <el-collapse accordion>
          <el-collapse-item
            v-for="dim in report.healthDimensions"
            :key="dim.dimension"
            :title="`${dim.dimension} — ${dimensionLevelLabel(dim.level)}`"
          >
            <el-descriptions :column="1" border>
              <el-descriptions-item label="评分">{{ dim.score }} / 100</el-descriptions-item>
              <el-descriptions-item label="说明">{{ dim.description }}</el-descriptions-item>
              <el-descriptions-item label="关联指标">
                <el-tag v-for="ind in dim.indicators" :key="ind" size="small" style="margin-right:4px">{{ ind }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-collapse-item>
        </el-collapse>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Check } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useReportStore } from '@/stores/report'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import type { RiskReport } from '@/types'

const router = useRouter()
const reportStore = useReportStore()
const userStore = useUserStore()
const appStore = useAppStore()

const report = computed<RiskReport | null>(() => reportStore.currentReport)

const radarChartRef = ref<HTMLDivElement>()
const barChartRef = ref<HTMLDivElement>()
const lineChartRef = ref<HTMLDivElement>()

let radarChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

// ---- 图表初始化 ----
function initRadarChart() {
  if (!radarChartRef.value || !report.value) return
  if (radarChart) radarChart.dispose()

  radarChart = echarts.init(radarChartRef.value)
  const data = report.value.radarData
  const indicator = data.map((d) => ({ name: d.dimension, max: d.maxScore }))
  const values = data.map((d) => d.score)

  radarChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { data: ['健康评分'], bottom: 0 },
    radar: {
      center: ['50%', '50%'],
      radius: '65%',
      indicator,
      axisName: { color: '#606266', fontSize: 12 },
    },
    series: [{
      type: 'radar',
      name: '健康评分',
      data: [{ value: values, name: '健康评分', areaStyle: { color: 'rgba(64, 158, 255, 0.2)' } }],
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#409eff', width: 2 },
      itemStyle: { color: '#409eff' },
    }],
  })
}

function initBarChart() {
  if (!barChartRef.value || !report.value) return
  if (barChart) barChart.dispose()

  barChart = echarts.init(barChartRef.value)
  const dims = report.value.healthDimensions

  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dims.map((d) => d.dimension),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', min: 0, max: 100, name: '评分' },
    series: [{
      type: 'bar',
      data: dims.map((d) => ({
        value: d.score,
        itemStyle: {
          color: d.score >= 85 ? '#67c23a' : d.score >= 70 ? '#409eff' : d.score >= 50 ? '#e6a23c' : '#f56c6c',
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barWidth: '50%',
      label: { show: true, position: 'top', fontSize: 12 },
    }],
  })
}

function initLineChart() {
  if (!lineChartRef.value || !report.value) return
  if (lineChart) lineChart.dispose()

  lineChart = echarts.init(lineChartRef.value)
  const data = report.value.trendData

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收缩压', '空腹血糖', '总胆固醇'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: data.map((d) => d.date), boundaryGap: false },
    yAxis: [
      {
        type: 'value',
        name: 'mmHg / mmol/L',
        axisLabel: { fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
    ],
    series: [
      {
        name: '收缩压',
        type: 'line',
        data: data.map((d) => d.bloodPressure),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#f56c6c' },
        itemStyle: { color: '#f56c6c' },
        markLine: {
          silent: true,
          data: [{ yAxis: 140, label: { formatter: '警戒线' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }],
        },
      },
      {
        name: '空腹血糖',
        type: 'line',
        data: data.map((d) => d.bloodSugar),
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#e6a23c' },
        itemStyle: { color: '#e6a23c' },
        markLine: {
          silent: true,
          data: [{ yAxis: 6.1, label: { formatter: '警戒线' }, lineStyle: { color: '#e6a23c', type: 'dashed' } }],
        },
      },
      {
        name: '总胆固醇',
        type: 'line',
        data: data.map((d) => d.cholesterol),
        smooth: true,
        symbol: 'triangle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#409eff' },
        itemStyle: { color: '#409eff' },
        markLine: {
          silent: true,
          data: [{ yAxis: 5.2, label: { formatter: '警戒线' }, lineStyle: { color: '#409eff', type: 'dashed' } }],
        },
      },
    ],
  })
}

function handleResize() {
  radarChart?.resize()
  barChart?.resize()
  lineChart?.resize()
}

// ---- 辅助计算 ----
const levelTagType = computed<'success' | 'warning' | 'danger' | 'info'>(() => {
  const map: Record<string, any> = { excellent: 'success', good: '', fair: 'warning', poor: 'danger' }
  return report.value ? map[report.value.overallLevel] : 'info'
})

const levelLabel = computed(() => {
  const map: Record<string, string> = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }
  return report.value ? map[report.value.overallLevel] : ''
})

function indicatorLevelTag(level: string): 'success' | 'warning' | 'danger' {
  const map: Record<string, any> = { normal: 'success', borderline: 'warning', abnormal: 'danger' }
  return map[level] || 'info'
}

function indicatorLevelLabel(level: string): string {
  const map: Record<string, string> = { normal: '正常', borderline: '临界', abnormal: '异常' }
  return map[level] || level
}

function dimensionLevelLabel(level: string): string {
  const map: Record<string, string> = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差' }
  return map[level] || level
}

// ---- 生命周期 ----
onMounted(async () => {
  appStore.setPageTitle('健康评估报告')
  await nextTick()
  initRadarChart()
  initBarChart()
  initLineChart()
  window.addEventListener('resize', handleResize)
})

// 监听路由进入（从问卷跳转过来时数据可能已更新）
watch(
  () => reportStore.currentReport,
  async (val) => {
    if (val) {
      await nextTick()
      initRadarChart()
      initBarChart()
      initLineChart()
    }
  },
)
</script>

<style scoped lang="scss">
.score-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.overall-score-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.score-number {
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
}

.score-unit {
  font-size: 14px;
  opacity: 0.8;
}

.score-detail {
  h2 {
    margin-bottom: 12px;
    font-weight: 600;
  }
}

.summary-text {
  font-size: 14px;
  line-height: 1.8;
  opacity: 0.9;
  margin-bottom: 8px;
}

.report-time {
  font-size: 12px;
  opacity: 0.7;
}

.chart-box {
  width: 100%;
  height: 400px;
}

.indicator-card {
  margin-bottom: 16px;
  border-left: 4px solid var(--border-color);
  transition: all 0.2s;

  &.indicator-normal { border-left-color: #67c23a; }
  &.indicator-borderline { border-left-color: #e6a23c; }
  &.indicator-abnormal { border-left-color: #f56c6c; }
}

.indicator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.indicator-name {
  font-weight: 600;
  font-size: 15px;
}

.indicator-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.indicator-unit {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 400;
}

.indicator-range {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.indicator-suggestions {
  margin-top: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-regular);
  line-height: 1.8;
}

@media (max-width: 768px) {
  .chart-box {
    height: 280px;
  }
  .overall-score-ring {
    width: 90px;
    height: 90px;
  }
  .score-number {
    font-size: 30px;
  }
  .indicator-value {
    font-size: 22px;
  }
}
</style>
