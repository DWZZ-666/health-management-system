import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RiskReport, HealthPlan } from '@/types'
import { getReportHistoryApi, getHealthPlansApi } from '@/api/report'

export const useReportStore = defineStore('report', () => {
  // ---- State ----
  const currentReport = ref<RiskReport | null>(null)
  const reportHistory = ref<RiskReport[]>([])
  const healthPlans = ref<HealthPlan[]>([])

  // ---- Actions ----
  function setCurrentReport(report: RiskReport): void {
    currentReport.value = report
  }

  async function fetchReportHistory(userId: number): Promise<void> {
    try {
      const res = await getReportHistoryApi(userId)
      reportHistory.value = res.data
    } catch {
      reportHistory.value = []
    }
  }

  async function fetchHealthPlans(userId: number): Promise<void> {
    try {
      const res = await getHealthPlansApi(userId)
      healthPlans.value = res.data
    } catch {
      healthPlans.value = []
    }
  }

  function clearReport(): void {
    currentReport.value = null
    healthPlans.value = []
  }

  return {
    currentReport,
    reportHistory,
    healthPlans,
    setCurrentReport,
    fetchReportHistory,
    fetchHealthPlans,
    clearReport,
  }
})
