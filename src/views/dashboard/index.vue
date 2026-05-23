<template>
  <div class="dashboard">
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
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <span class="card-header-title">快捷操作</span>
          </template>
          <el-row :gutter="12">
            <el-col :xs="12" :sm="6" v-for="action in quickActions" :key="action.label">
              <div class="quick-action" @click="router.push(action.path)">
                <el-icon :size="32" :color="action.color">
                  <component :is="action.icon" />
                </el-icon>
                <span>{{ action.label }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <span class="card-header-title">健康小贴士</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(tip, idx) in healthTips"
              :key="idx"
              :timestamp="''"
              placement="top"
            >
              {{ tip }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Document,
  Edit,
  DataAnalysis,
  Guide,
  Plus,
  Search,
  TrendCharts,
  SetUp,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { onMounted } from 'vue'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

onMounted(() => {
  appStore.setPageTitle('工作台')
})

const statCards = [
  { label: '健康档案', value: '已建档', icon: Document, bgColor: '#e6f7ff' },
  { label: '风险评估', value: '待评估', icon: Edit, bgColor: '#fff7e6' },
  { label: '健康报告', value: '1 份', icon: DataAnalysis, bgColor: '#f6ffed' },
  { label: '健康方案', value: '3 项', icon: Guide, bgColor: '#f0f5ff' },
]

const quickActions = [
  { label: '填写档案', icon: Plus, path: '/health-records', color: '#409eff' },
  { label: '风险评估', icon: Search, path: '/questionnaire', color: '#e6a23c' },
  { label: '查看报告', icon: DataAnalysis, path: '/report', color: '#67c23a' },
  { label: '健康方案', icon: Guide, path: '/recommendation', color: '#909399' },
]

const healthTips = [
  '每天保持30分钟中等强度运动',
  '成年人每日食盐摄入不超过5g',
  '每周至少吃2次深海鱼类',
  '保持7-8小时充足睡眠',
  '每年定期进行健康体检',
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
  color: var(--text-primary);
}

.card-header-title {
  font-weight: 600;
  font-size: 16px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-color);
    transform: translateY(-2px);
  }

  span {
    font-size: 13px;
    color: var(--text-regular);
  }
}
</style>
