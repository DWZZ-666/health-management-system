/**
 * 工具函数模块
 */

const TOKEN_KEY = 'health_token'
const REFRESH_TOKEN_KEY = 'health_refresh_token'
const USER_INFO_KEY = 'health_user_info'

/** 获取 Token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** 设置 Token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 移除 Token */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 获取刷新 Token */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/** 设置刷新 Token */
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

/** 移除刷新 Token */
export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/** 获取本地用户信息 */
export function getLocalUserInfo<T = any>(): T | null {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 设置本地用户信息 */
export function setLocalUserInfo(info: any): void {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

/** 清除所有认证信息 */
export function clearAuth(): void {
  removeToken()
  removeRefreshToken()
  localStorage.removeItem(USER_INFO_KEY)
}

/** 格式化日期 */
export function formatDate(date: string | Date, fmt = 'YYYY-MM-DD'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '--'
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0'),
  }
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => map[k])
}

/** BMI 计算 */
export function calcBMI(weight: number, heightCm: number): number {
  const h = heightCm / 100
  return +(weight / (h * h)).toFixed(1)
}

/** BMI 等级判定 */
export function getBMILevel(bmi: number): string {
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '偏胖'
  return '肥胖'
}

/** 深拷贝 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
