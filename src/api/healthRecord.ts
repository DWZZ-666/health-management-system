import request from './request'
import type { ApiResponse, HealthRecord } from '@/types'

/** 获取某用户的健康档案 */
export function getHealthRecordsByUserApi(userId: number) {
  return request.get<any, ApiResponse<HealthRecord[]>>(`/healthRecords?userId=${userId}`)
}

/** 新增健康档案 */
export function createHealthRecordApi(data: Partial<HealthRecord>) {
  return request.post<any, ApiResponse<HealthRecord>>('/healthRecords', data)
}

/** 更新健康档案 */
export function updateHealthRecordApi(id: number, data: Partial<HealthRecord>) {
  return request.put<any, ApiResponse<HealthRecord>>(`/healthRecords/${id}`, data)
}

/** 删除健康档案 */
export function deleteHealthRecordApi(id: number) {
  return request.delete<any, ApiResponse<null>>(`/healthRecords/${id}`)
}
