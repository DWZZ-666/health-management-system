// ==================== 用户相关类型 ====================

/** 用户角色枚举 */
export type UserRole = 'user' | 'admin'

/** 用户性别 */
export type Gender = 'male' | 'female' | 'unknown'

/** 用户基本信息 */
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  gender: Gender
  age: number
  role: UserRole
  createdAt: string
}

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResult {
  token: string
  refreshToken: string
  userInfo: UserInfo
}

// ==================== 健康档案类型 ====================

/** 健康档案 */
export interface HealthRecord {
  id: number
  userId: number
  height: number        // cm
  weight: number        // kg
  bmi: number
  systolicBP: number    // 收缩压 mmHg
  diastolicBP: number   // 舒张压 mmHg
  bloodSugar: number    // 空腹血糖 mmol/L
  totalCholesterol: number  // 总胆固醇 mmol/L
  triglycerides: number     // 甘油三酯 mmol/L
  hdl: number           // 高密度脂蛋白 mmol/L
  ldl: number           // 低密度脂蛋白 mmol/L
  heartRate: number     // 静息心率 bpm
  sleepHours: number    // 日均睡眠时长
  exerciseFrequency: number  // 每周运动次数
  smokingStatus: 'never' | 'former' | 'current'
  alcoholConsumption: 'none' | 'light' | 'moderate' | 'heavy'
  familyHistory: string[]
  createdAt: string
  updatedAt: string
}

// ==================== 问卷相关类型 ====================

/** 题目类型 */
export type QuestionType = 'single' | 'multiple' | 'number' | 'scale'

/** 问卷选项 */
export interface QuestionOption {
  label: string
  value: string | number
  score?: number
}

/** 问卷题目 */
export interface Question {
  id: number
  category: string           // 分类：生活习惯、身体状况、心理健康、家族病史
  type: QuestionType
  title: string
  options?: QuestionOption[]
  required: boolean
  min?: number               // 数值题最小值
  max?: number               // 数值题最大值
  unit?: string              // 数值题单位
  placeholder?: string
}

/** 问卷答案 */
export interface Answer {
  questionId: number
  value: string | number | string[]
}

/** 问卷提交参数 */
export interface QuestionnaireSubmission {
  userId: number
  answers: Answer[]
}

// ==================== 风险评估报告类型 ====================

/** 单项风险指标 */
export interface RiskIndicator {
  name: string               // 指标名称
  value: number              // 当前值
  normalRange: [number, number]  // 正常范围
  unit: string               // 单位
  level: 'normal' | 'borderline' | 'abnormal'   // 风险等级
  score: number              // 风险评分 0-100
  suggestions: string[]      // 改进建议
}

/** 健康维度评估 */
export interface HealthDimension {
  dimension: string          // 维度名称（心血管、代谢、营养、运动、心理等）
  score: number              // 0-100 评分
  level: 'excellent' | 'good' | 'fair' | 'poor'
  description: string
  indicators: string[]       // 关联指标
}

/** 综合风险评估报告 */
export interface RiskReport {
  id: number
  userId: number
  overallScore: number        // 综合健康评分 0-100
  overallLevel: 'excellent' | 'good' | 'fair' | 'poor'
  riskIndicators: RiskIndicator[]
  healthDimensions: HealthDimension[]
  radarData: RadarDataItem[]
  trendData: TrendDataItem[]
  summary: string
  generatedAt: string
}

/** 雷达图数据项 */
export interface RadarDataItem {
  dimension: string
  score: number
  maxScore: number
}

/** 趋势图数据项 */
export interface TrendDataItem {
  date: string
  bloodPressure: number
  bloodSugar: number
  cholesterol: number
}

// ==================== 健康方案推荐类型 ====================

/** 健康推荐方案 */
export interface HealthPlan {
  id: number
  userId: number
  type: 'diet' | 'exercise' | 'lifestyle' | 'medical'
  title: string
  content: string
  items: PlanItem[]
  createdAt: string
}

/** 方案具体条目 */
export interface PlanItem {
  name: string
  description: string
  frequency?: string
  duration?: string
  intensity?: 'low' | 'medium' | 'high'
}

// ==================== API 通用响应类型 ====================

/** 统一 API 响应格式 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 分页请求参数 */
export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
}

/** 分页响应 */
export interface PaginatedData<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}

// ==================== 路由 Meta 类型扩展 ====================

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: UserRole[]
    icon?: string
    hidden?: boolean
  }
}
