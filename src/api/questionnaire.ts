/**
 * 问卷与评估 API
 */
import request from './request'
import type { ApiResponse, Question, QuestionnaireSubmission, RiskReport } from '@/types'

/** 获取问卷题目列表 */
export function getQuestionsApi(): Promise<ApiResponse<Question[]>> {
  return request.get('/questions')
}

/** 提交问卷答案并获取评估报告 */
export function submitQuestionnaireApi(params: QuestionnaireSubmission): Promise<ApiResponse<RiskReport>> {
  return request.post('/questionnaire/submit', params)
}
