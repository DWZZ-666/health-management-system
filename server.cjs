/**
 * json-server 自定义服务（含 JWT 认证 + 报告生成算法）
 * 使用 CommonJS 语法兼容 json-server@0.17.x
 */
const jsonServer = require('json-server')
const path = require('path')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults({ noCors: false })

// ==================== CORS ====================
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

server.use(middlewares)
server.use(jsonServer.bodyParser)

// ==================== Token 工具 ====================
function generateToken(userId) {
  return 'token_' + userId + '_' + Date.now()
}

function parseToken(token) {
  if (!token) return null
  const match = token.replace('Bearer ', '').match(/^token_(\d+)_/)
  return match ? parseInt(match[1]) : null
}

const db = router.db

// ==================== 登录接口 ====================
server.post('/api/login', (req, res) => {
  const { username, password } = req.body
  const user = db.get('users').find({ username, password }).value()

  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null })
  }

  const token = generateToken(user.id)
  const { password: _, ...userInfo } = user

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      refreshToken: 'refresh_' + token,
      userInfo,
    },
  })
})

// ==================== 获取用户信息 ====================
server.get('/api/userinfo', (req, res) => {
  const userId = parseToken(req.headers.authorization)
  if (!userId) {
    return res.status(401).json({ code: 401, message: '未登录', data: null })
  }

  const user = db.get('users').find({ id: userId }).value()
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在', data: null })
  }

  const { password: _, ...userInfo } = user
  res.json({ code: 200, message: 'ok', data: userInfo })
})

// ==================== 登出 ====================
server.post('/api/logout', (_req, res) => {
  res.json({ code: 200, message: 'ok', data: null })
})

// ==================== 问卷提交 → 生成报告 ====================
server.post('/api/questionnaire/submit', (req, res) => {
  const { userId, answers } = req.body

  // 从答案中提取关键数据
  const getVal = (qId) => {
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
  const height = getVal(3)
  const weight = getVal(4)

  // 风险评估算法
  const bpLevel =
    systolicBP < 120 && diastolicBP < 80 ? 'normal'
    : systolicBP < 140 && diastolicBP < 90 ? 'borderline'
    : 'abnormal'

  const bsLevel =
    bloodSugar < 6.1 ? 'normal' : bloodSugar < 7.0 ? 'borderline' : 'abnormal'

  const tcLevel =
    totalCholesterol < 5.2 ? 'normal' : totalCholesterol < 6.2 ? 'borderline' : 'abnormal'

  const tgLevel =
    triglycerides < 1.7 ? 'normal' : triglycerides < 2.3 ? 'borderline' : 'abnormal'

  const bmi = weight / ((height / 100) ** 2)
  const bmiLevel =
    bmi >= 18.5 && bmi < 24 ? 'normal' : (bmi < 18.5 || bmi < 28) ? 'borderline' : 'abnormal'

  const sleepLevel =
    sleepHours >= 7 && sleepHours <= 9 ? 'normal'
    : (sleepHours >= 5 && sleepHours <= 10) ? 'borderline'
    : 'abnormal'

  // 各维度评分
  const cardioScore = Math.max(10, 100 - (systolicBP - 120) * 0.8 - (diastolicBP - 80) * 0.5)
  const metabolicScore = Math.max(10, 100 - (bloodSugar - 5.0) * 20 - (totalCholesterol - 4.5) * 15)
  const nutritionScore = Math.max(10, 100 - Math.abs(bmi - 22) * 6)
  const mentalScore = Math.max(10, 80 - (sleepHours < 7 ? (7 - sleepHours) * 10 : 0))
  const lifestyleScore = Math.max(10, 60 + (exerciseFreq > 1 ? exerciseFreq * 8 : -20))

  const overallScore = Math.round(
    cardioScore * 0.3 + metabolicScore * 0.25 + nutritionScore * 0.2 + mentalScore * 0.15 + lifestyleScore * 0.1
  )

  const overallLevel =
    overallScore >= 85 ? 'excellent' : overallScore >= 70 ? 'good' : overallScore >= 50 ? 'fair' : 'poor'

  function scoreToLevel(s) {
    if (s >= 85) return 'excellent'
    if (s >= 70) return 'good'
    if (s >= 50) return 'fair'
    return 'poor'
  }

  // 生成趋势数据
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  const trendData = months.map((m, i) => ({
    date: m,
    bloodPressure: +(systolicBP + (Math.random() - 0.5) * 20 - (5 - i) * 2).toFixed(1),
    bloodSugar: +(bloodSugar + (Math.random() - 0.5) * 1.0 - (5 - i) * 0.1).toFixed(1),
    cholesterol: +(totalCholesterol + (Math.random() - 0.5) * 1.0 - (5 - i) * 0.1).toFixed(1),
  }))

  const levelSummaryMap = {
    excellent: '您的整体健康状况良好，各项指标均在正常范围内。请继续保持当前的生活方式，并定期进行健康体检。',
    good: '您的健康状况总体不错，部分指标处于临界值。建议针对薄弱环节进行调整，预防潜在健康风险。',
    fair: '您的部分健康指标需要关注，建议尽快调整生活方式，必要时咨询专业医生进行全面检查。',
    poor: '您的健康风险较高，强烈建议您尽快就医进行全面检查，并根据医生建议制定详细的健康管理计划。',
  }

  const report = {
    id: Date.now(),
    userId: userId || 2,
    overallScore,
    overallLevel,
    riskIndicators: [
      {
        name: '血压', value: systolicBP, normalRange: [90, 139], unit: 'mmHg', level: bpLevel,
        score: Math.round(cardioScore),
        suggestions: bpLevel === 'abnormal'
          ? ['建议每日监测血压', '减少钠盐摄入', '遵医嘱服用降压药物', '每周至少150分钟中等强度运动']
          : bpLevel === 'borderline'
            ? ['注意低盐饮食', '每周测量血压1-2次', '增加有氧运动']
            : ['保持健康生活方式', '定期复查血压'],
      },
      {
        name: '空腹血糖', value: bloodSugar, normalRange: [3.9, 6.1], unit: 'mmol/L', level: bsLevel,
        score: Math.round(metabolicScore),
        suggestions: bsLevel === 'abnormal'
          ? ['立即就医咨询内分泌科', '严格控制碳水摄入', '每日监测血糖', '遵医嘱用药']
          : bsLevel === 'borderline'
            ? ['控制甜食和精制碳水', '每周检测血糖', '增加膳食纤维摄入', '餐后适度散步']
            : ['保持均衡饮食', '定期年度体检'],
      },
      {
        name: '总胆固醇', value: totalCholesterol, normalRange: [2.8, 5.2], unit: 'mmol/L', level: tcLevel,
        score: Math.round(metabolicScore * 0.9),
        suggestions: tcLevel === 'abnormal'
          ? ['减少饱和脂肪摄入', '增加Omega-3摄入', '考虑降脂药物', '每周有氧运动3-5次']
          : tcLevel === 'borderline'
            ? ['控制红肉和油炸食品', '多吃坚果和鱼类', '增加运动频率']
            : ['保持当前饮食习惯', '继续定期检查'],
      },
      {
        name: '甘油三酯', value: triglycerides, normalRange: [0.4, 1.7], unit: 'mmol/L', level: tgLevel,
        score: Math.round(metabolicScore * 0.85),
        suggestions: tgLevel === 'abnormal'
          ? ['严格控制碳水化合物', '戒酒', '增加鱼油摄入', '咨询医生评估用药']
          : ['控制精制糖类摄入', '限制饮酒', '增加有氧运动'],
      },
      {
        name: 'BMI 指数', value: +bmi.toFixed(1), normalRange: [18.5, 24], unit: 'kg/m²', level: bmiLevel,
        score: Math.round(nutritionScore),
        suggestions: bmiLevel === 'abnormal'
          ? bmi >= 28
            ? ['制定科学减重计划', '咨询营养师', '每日热量控制', '结合有氧+力量训练']
            : ['适当增加热量摄入', '补充优质蛋白', '规律力量训练']
          : ['保持当前体重', '均衡膳食'],
      },
      {
        name: '睡眠质量', value: sleepHours, normalRange: [7, 9], unit: '小时/天', level: sleepLevel,
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
    trendData,
    summary: levelSummaryMap[overallLevel],
    generatedAt: new Date().toISOString(),
  }

  // 保存到 db.json
  db.get('reports').push(report).write()

  res.json({ code: 200, message: '评估完成', data: report })
})

// ==================== 获取用户报告历史 ====================
server.get('/api/reports/history/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  const reports = db.get('reports').filter({ userId }).value()
  res.json({ code: 200, message: 'ok', data: reports })
})

// ==================== 获取用户健康方案 ====================
server.get('/api/plans/:userId', (req, res) => {
  const userId = parseInt(req.params.userId)
  const plans = db.get('healthPlans').filter({ userId }).value()
  res.json({ code: 200, message: 'ok', data: plans })
})

// ==================== 响应包装中间件 ====================
// 拦截 json-server 原始响应，包装为标准 { code, message, data } 格式
const originalSend = router.render.bind(router)
router.render = (req, res) => {
  // 跳过已经手动处理过的自定义路由（它们自己调用了 res.json）
  // 只包装 GET 请求（json-server 原生路由）
  if (res.headersSent) return

  const data = res.locals.data
  if (data !== undefined) {
    res.jsonp({
      code: 200,
      message: 'ok',
      data: Array.isArray(data) ? data : data,
    })
  }
}

// ==================== json-server 路由（兜底） ====================
server.use('/api', router)

// ==================== 启动 ====================
const PORT = 3001
server.listen(PORT, () => {
  console.log(`\n  🏥 健康管理系统 Mock API 服务已启动:`)
  console.log(`  ➜  http://localhost:${PORT}/api`)
  console.log(`  ➜  登录:    POST /api/login`)
  console.log(`  ➜  用户信息: GET  /api/userinfo`)
  console.log(`  ➜  问卷:    GET  /api/questions`)
  console.log(`  ➜  提交问卷: POST /api/questionnaire/submit`)
  console.log(`  ➜  报告历史: GET  /api/reports/history/:userId`)
  console.log(`  ➜  健康方案: GET  /api/plans/:userId\n`)
})
