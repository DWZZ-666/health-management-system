<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">健康方案推荐</h2>
      <el-button type="primary" @click="loadPlans" :loading="loading">
        <el-icon><Refresh /></el-icon>刷新方案
      </el-button>
    </div>

    <el-empty v-if="!loading && plans.length === 0" description="暂无推荐方案，请先完成风险评估" />

    <el-row :gutter="20">
      <el-col :xs="24" :md="12" :lg="8" v-for="plan in plans" :key="plan.id">
        <el-card class="plan-card" shadow="hover">
          <template #header>
            <div class="plan-header">
              <el-tag :type="planTypeTag(plan.type)" size="small">{{ planTypeLabel(plan.type) }}</el-tag>
              <span class="plan-title">{{ plan.title }}</span>
            </div>
          </template>
          <p class="plan-content">{{ plan.content }}</p>
          <el-divider />
          <div v-for="(item, idx) in plan.items" :key="idx" class="plan-item">
            <el-icon :size="16" color="#409eff"><Check /></el-icon>
            <div class="item-detail">
              <strong>{{ item.name }}</strong>
              <p>{{ item.description }}</p>
              <div class="item-meta">
                <el-tag v-if="item.frequency" size="small" type="info">{{ item.frequency }}</el-tag>
                <el-tag v-if="item.intensity" size="small" :type="intensityTag(item.intensity)">
                  {{ intensityLabel(item.intensity) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh, Check } from '@element-plus/icons-vue'
import { useReportStore } from '@/stores/report'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import type { HealthPlan } from '@/types'

const reportStore = useReportStore()
const userStore = useUserStore()
const appStore = useAppStore()

const plans = ref<HealthPlan[]>([])
const loading = ref(false)

function planTypeTag(type: string): 'success' | 'warning' | '' | 'info' | 'danger' {
  const map: Record<string, any> = { diet: 'success', exercise: 'warning', lifestyle: 'info', medical: 'danger' }
  return map[type] || 'info'
}

function planTypeLabel(type: string): string {
  const map: Record<string, string> = { diet: '饮食', exercise: '运动', lifestyle: '生活', medical: '医疗' }
  return map[type] || type
}

function intensityTag(intensity: string): 'success' | 'warning' | 'danger' {
  const map: Record<string, any> = { low: 'success', medium: 'warning', high: 'danger' }
  return map[intensity] || 'info'
}

function intensityLabel(intensity: string): string {
  const map: Record<string, string> = { low: '低强度', medium: '中强度', high: '高强度' }
  return map[intensity] || intensity
}

async function loadPlans() {
  loading.value = true
  await reportStore.fetchHealthPlans(userStore.userId)
  plans.value = reportStore.healthPlans
  loading.value = false
}

onMounted(async () => {
  appStore.setPageTitle('健康方案推荐')
  await loadPlans()
})
</script>

<style scoped lang="scss">
.plan-card {
  margin-bottom: 20px;
  height: 100%;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-title {
  font-weight: 600;
  font-size: 15px;
}

.plan-content {
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.8;
}

.plan-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;

  .item-detail {
    flex: 1;

    strong {
      font-size: 14px;
    }

    p {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 4px 0;
      line-height: 1.6;
    }

    .item-meta {
      display: flex;
      gap: 6px;
    }
  }
}
</style>
