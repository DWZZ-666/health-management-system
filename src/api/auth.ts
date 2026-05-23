/**
 * 认证相关 API
 */
import request from './request'
import type { ApiResponse, LoginParams, LoginResult, UserInfo } from '@/types'

/** 登录 */
export function loginApi(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  return request.post('/login', params)
}

/** 获取当前用户信息 */
export function getUserInfoApi(): Promise<ApiResponse<UserInfo>> {
  return request.get('/userinfo')
}

/** 登出 */
export function logoutApi(): Promise<ApiResponse<null>> {
  return request.post('/logout')
}
