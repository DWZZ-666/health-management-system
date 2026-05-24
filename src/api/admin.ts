import request from './request'
import type { ApiResponse, UserInfo, HealthRecord, RiskReport } from '@/types'

/** 获取所有用户 */
export function getUsersApi() {
  return request.get<any, ApiResponse<UserInfo[]>>('/users')
}

/** 新增用户 */
export function createUserApi(data: Partial<UserInfo> & { password: string }) {
  return request.post<any, ApiResponse<UserInfo>>('/users', data)
}

/** 更新用户 */
export function updateUserApi(id: number, data: Partial<UserInfo> & { password?: string }) {
  return request.put<any, ApiResponse<UserInfo>>(`/users/${id}`, data)
}

/** 删除用户 */
export function deleteUserApi(id: number) {
  return request.delete<any, ApiResponse<null>>(`/users/${id}`)
}

/** 获取所有健康档案 */
export function getHealthRecordsApi() {
  return request.get<any, ApiResponse<HealthRecord[]>>('/healthRecords')
}

/** 获取所有报告 */
export function getReportsApi() {
  return request.get<any, ApiResponse<RiskReport[]>>('/reports')
}

/** 删除报告 */
export function deleteReportApi(id: number) {
  return request.delete<any, ApiResponse<null>>(`/reports/${id}`)
}
