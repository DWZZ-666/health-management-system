/**
 * 报告与方案 API
 */
import request from './request'
import type { ApiResponse, RiskReport, HealthPlan } from '@/types'

/** 获取用户报告历史 */
export function getReportHistoryApi(userId: number): Promise<ApiResponse<RiskReport[]>> {
  return request.get(`/reports/history/${userId}`)
}

/** 获取用户健康方案推荐 */
export function getHealthPlansApi(userId: number): Promise<ApiResponse<HealthPlan[]>> {
  return request.get(`/plans/${userId}`)
}
