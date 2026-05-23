import type { ApiResponse, RiskReport, HealthPlan, Answer } from '@/types'

/** 根据问卷答案生成评估报告（Mock 算法） */
export function mockGenerateReport(userId: number, answers: Answer[]): Promise<ApiResponse<RiskReport>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 从答案中提取关键数据
      const getVal = (qId: number): number => {
        const a = answers.find((a) => a.questionId === qId)
        return a ? Number(a.value) : 0
      }

      const systolicBP = getVal(10)
      const diastolicBP = getVal(11)
      const bloodSugar = getVal(12)
      const totalCholesterol = getVal(13)
      const triglycerides = getVal(14) || 1.7
      const heartRate = getVal(15)
      const sleepHours = getVal(8)
      const exerciseFreq = getVal(7)
      const age = getVal(1)
      const height = getVal(3)
      const weight = getVal(4)

      // 风险评估逻辑
      const bpLevel: 'normal' | 'borderline' | 'abnormal' =
        systolicBP < 120 && diastolicBP < 80 ? 'normal' :
        systolicBP < 140 && diastolicBP < 90 ? 'borderline' : 'abnormal'

      const bsLevel: 'normal' | 'borderline' | 'abnormal' =
        bloodSugar < 6.1 ? 'normal' : bloodSugar < 7.0 ? 'borderline' : 'abnormal'

      const tcLevel: 'normal' | 'borderline' | 'abnormal' =
        totalCholesterol < 5.2 ? 'normal' : totalCholesterol < 6.2 ? 'borderline' : 'abnormal'

      const tgLevel: 'normal' | 'borderline' | 'abnormal' =
        triglycerides < 1.7 ? 'normal' : triglycerides < 2.3 ? 'borderline' : 'abnormal'

      const bmi = weight / ((height / 100) ** 2)
      const bmiLevel: 'normal' | 'borderline' | 'abnormal' =
        bmi >= 18.5 && bmi < 24 ? 'normal' : (bmi < 18.5 || bmi < 28) ? 'borderline' : 'abnormal'

      const sleepLevel: 'normal' | 'borderline' | 'abnormal' =
        sleepHours >= 7 && sleepHours <= 9 ? 'normal' : (sleepHours >= 5 && sleepHours <= 10) ? 'borderline' : 'abnormal'

      // 计算各维度评分
      const cardioScore = Math.max(10, 100 - (systolicBP - 120) * 0.8 - (diastolicBP - 80) * 0.5)
      const metabolicScore = Math.max(10, 100 - (bloodSugar - 5.0) * 20 - (totalCholesterol - 4.5) * 15)
      const nutritionScore = Math.max(10, 100 - Math.abs(bmi - 22) * 6)
      const mentalScore = Math.max(10, 80 - (sleepHours < 7 ? (7 - sleepHours) * 10 : 0))
      const lifestyleScore = Math.max(10, 60 + (exerciseFreq > 1 ? exerciseFreq * 8 : -20))

      const overallScore = Math.round(
        (cardioScore * 0.3 + metabolicScore * 0.25 + nutritionScore * 0.2 + mentalScore * 0.15 + lifestyleScore * 0.1)
      )

      const overallLevel: RiskReport['overallLevel'] =
        overallScore >= 85 ? 'excellent' : overallScore >= 70 ? 'good' : overallScore >= 50 ? 'fair' : 'poor'

      const report: RiskReport = {
        id: Date.now(),
        userId,
        overallScore,
        overallLevel,
        riskIndicators: [
          {
            name: '血压',
            value: systolicBP,
            normalRange: [90, 139],
            unit: 'mmHg',
            level: bpLevel,
            score: Math.round(cardioScore),
            suggestions: bpLevel === 'abnormal'
              ? ['建议每日监测血压', '减少钠盐摄入', '遵医嘱服用降压药物', '每周至少150分钟中等强度运动']
              : bpLevel === 'borderline'
                ? ['注意低盐饮食', '每周测量血压1-2次', '增加有氧运动']
                : ['保持健康生活方式', '定期复查血压'],
          },
          {
            name: '空腹血糖',
            value: bloodSugar,
            normalRange: [3.9, 6.1],
            unit: 'mmol/L',
            level: bsLevel,
            score: Math.round(metabolicScore),
            suggestions: bsLevel === 'abnormal'
              ? ['立即就医咨询内分泌科', '严格控制碳水摄入', '每日监测血糖', '遵医嘱用药']
              : bsLevel === 'borderline'
                ? ['控制甜食和精制碳水', '每周检测血糖', '增加膳食纤维摄入', '餐后适度散步']
                : ['保持均衡饮食', '定期年度体检'],
          },
          {
            name: '总胆固醇',
            value: totalCholesterol,
            normalRange: [2.8, 5.2],
            unit: 'mmol/L',
            level: tcLevel,
            score: Math.round(metabolicScore * 0.9),
            suggestions: tcLevel === 'abnormal'
              ? ['减少饱和脂肪摄入', '增加Omega-3摄入', '考虑降脂药物', '每周有氧运动3-5次']
              : tcLevel === 'borderline'
                ? ['控制红肉和油炸食品', '多吃坚果和鱼类', '增加运动频率']
                : ['保持当前饮食习惯', '继续定期检查'],
          },
          {
            name: '甘油三酯',
            value: triglycerides,
            normalRange: [0.4, 1.7],
            unit: 'mmol/L',
            level: tgLevel,
            score: Math.round(metabolicScore * 0.85),
            suggestions: tgLevel === 'abnormal'
              ? ['严格控制碳水化合物', '戒酒', '增加鱼油摄入', '咨询医生评估用药']
              : ['控制精制糖类摄入', '限制饮酒', '增加有氧运动'],
          },
          {
            name: 'BMI 指数',
            value: +bmi.toFixed(1),
            normalRange: [18.5, 24],
            unit: 'kg/m²',
            level: bmiLevel,
            score: Math.round(nutritionScore),
            suggestions: bmiLevel === 'abnormal'
              ? bmi >= 28
                ? ['制定科学减重计划', '咨询营养师', '每日热量控制', '结合有氧+力量训练']
                : ['适当增加热量摄入', '补充优质蛋白', '规律力量训练']
              : ['保持当前体重', '均衡膳食'],
          },
          {
            name: '睡眠质量',
            value: sleepHours,
            normalRange: [7, 9],
            unit: '小时/天',
            level: sleepLevel,
            score: Math.round(mentalScore),
            suggestions: sleepLevel === 'abnormal'
              ? ['固定作息时间', '睡前避免屏幕蓝光', '限制咖啡因摄入', '如持续失眠请就医']
              : ['保持规律作息', '午休20-30分钟'],
          },
        ],
        healthDimensions: [
          { dimension: '心血管健康', score: Math.round(cardioScore), level: scoreToLevel(cardioScore), description: '评估血压、心率和心脏相关风险', indicators: ['血压', '静息心率'] },
          { dimension: '代谢健康', score: Math.round(metabolicScore), level: scoreToLevel(metabolicScore), description: '评估血糖、血脂等代谢指标', indicators: ['空腹血糖', '总胆固醇', '甘油三酯'] },
          { dimension: '营养状况', score: Math.round(nutritionScore), level: scoreToLevel(nutritionScore), description: '基于BMI和饮食习惯的评估', indicators: ['BMI', '饮食习惯'] },
          { dimension: '心理健康', score: Math.round(mentalScore), level: scoreToLevel(mentalScore), description: '心理状态与睡眠质量评估', indicators: ['睡眠质量', '焦虑程度'] },
          { dimension: '生活习惯', score: Math.round(lifestyleScore), level: scoreToLevel(lifestyleScore), description: '运动、吸烟、饮酒等生活习惯', indicators: ['运动频率', '吸烟', '饮酒'] },
        ],
        radarData: [
          { dimension: '心血管', score: Math.round(cardioScore), maxScore: 100 },
          { dimension: '代谢', score: Math.round(metabolicScore), maxScore: 100 },
          { dimension: '营养', score: Math.round(nutritionScore), maxScore: 100 },
          { dimension: '心理', score: Math.round(mentalScore), maxScore: 100 },
          { dimension: '生活习惯', score: Math.round(lifestyleScore), maxScore: 100 },
        ],
        trendData: generateTrendData(systolicBP, bloodSugar, totalCholesterol),
        summary: generateSummary(overallScore, overallLevel),
        generatedAt: new Date().toISOString(),
      }

      resolve({ code: 200, message: 'ok', data: report })
    }, 1500)
  })
}

/** 模拟获取历史报告列表 */
export function mockGetReportHistory(_userId: number): Promise<ApiResponse<RiskReport[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ code: 200, message: 'ok', data: [] })
    }, 300)
  })
}

/** 模拟获取健康方案推荐 */
export function mockGetHealthPlans(userId: number): Promise<ApiResponse<HealthPlan[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const plans: HealthPlan[] = [
        {
          id: 1,
          userId,
          type: 'diet',
          title: '个性化饮食方案',
          content: '基于您的代谢指标和BMI情况，建议采用以下饮食方案：控制总热量摄入，增加优质蛋白和膳食纤维比例，减少精制碳水和高脂食物。',
          items: [
            { name: '全谷物主食', description: '每日主食中至少50%为全谷物，如糙米、燕麦、藜麦', frequency: '每日' },
            { name: '优质蛋白', description: '鱼类每周2-3次，去皮禽肉、豆制品适量', frequency: '每周' },
            { name: '蔬菜摄入', description: '每日蔬菜500g以上，深色蔬菜占一半', frequency: '每日' },
            { name: '控制用油', description: '每日烹调用油不超过25g', frequency: '每日' },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          userId,
          type: 'exercise',
          title: '科学运动方案',
          content: '根据您的心血管评估结果，推荐以中低强度有氧运动为主，逐步增加运动强度和时长。',
          items: [
            { name: '快走', description: '每次30-45分钟，心率控制在(220-年龄)×60%-70%', frequency: '每周5次', intensity: 'medium' },
            { name: '游泳或骑行', description: '低冲击有氧运动，保护关节', frequency: '每周2次', intensity: 'medium' },
            { name: '力量训练', description: '器械或自重训练，增强肌肉力量', frequency: '每周2次', intensity: 'low' },
            { name: '拉伸放松', description: '运动后进行10-15分钟拉伸', frequency: '每次运动后', intensity: 'low' },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          userId,
          type: 'lifestyle',
          title: '生活方式调整建议',
          content: '良好的生活习惯是健康的基础，以下建议针对您的生活方式评估结果制定。',
          items: [
            { name: '规律作息', description: '固定就寝和起床时间，保证7-8小时睡眠', frequency: '每日' },
            { name: '压力管理', description: '每天安排10-15分钟冥想或深呼吸练习', frequency: '每日' },
            { name: '社交活动', description: '保持适度的社交互动，参与兴趣小组', frequency: '每周1-2次' },
            { name: '定期体检', description: '每年至少一次全面健康体检', frequency: '每年' },
          ],
          createdAt: new Date().toISOString(),
        },
      ]
      resolve({ code: 200, message: 'ok', data: plans })
    }, 500)
  })
}

/** 评分 → 等级 */
function scoreToLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

/** 生成趋势数据（模拟近6个月） */
function generateTrendData(
  currentBP: number,
  currentBS: number,
  currentTC: number,
): Array<{ date: string; bloodPressure: number; bloodSugar: number; cholesterol: number }> {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  return months.map((m, i) => ({
    date: m,
    bloodPressure: +(currentBP + (Math.random() - 0.5) * 20 - (5 - i) * 2).toFixed(1),
    bloodSugar: +(currentBS + (Math.random() - 0.5) * 1.0 - (5 - i) * 0.1).toFixed(1),
    cholesterol: +(currentTC + (Math.random() - 0.5) * 1.0 - (5 - i) * 0.1).toFixed(1),
  }))
}

/** 生成综合评估摘要 */
function generateSummary(_score: number, level: string): string {
  const levelMap: Record<string, string> = {
    excellent: '您的整体健康状况良好，各项指标均在正常范围内。请继续保持当前的生活方式，并定期进行健康体检。',
    good: '您的健康状况总体不错，部分指标处于临界值。建议针对薄弱环节进行调整，预防潜在健康风险。',
    fair: '您的部分健康指标需要关注，建议尽快调整生活方式，必要时咨询专业医生进行全面检查。',
    poor: '您的健康风险较高，强烈建议您尽快就医进行全面检查，并根据医生建议制定详细的健康管理计划。',
  }
  return levelMap[level] || ''
}
