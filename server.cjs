/**
 * json-server 自定义服务 — 融合健康风险评估的智能健康管理系统
 * 端口: 3001
 * 启动: node server.cjs
 */
const jsonServer = require('json-server')
const path = require('path')
const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults({ noCors: false })

// ===================== 内存 Token 存储 =====================
const tokenStore = {} // token -> { userId, username, role, expiresAt }

function generateToken() {
  return 'token_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
}

function extractToken(req) {
  const auth = req.headers.authorization || ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

function verifyToken(req) {
  const token = extractToken(req)
  if (!token || !tokenStore[token]) return null
  if (Date.now() > tokenStore[token].expiresAt) {
    delete tokenStore[token]
    return null
  }
  return tokenStore[token]
}

// ===================== 中间件 =====================
server.use(jsonServer.bodyParser)

// CORS 放行
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ===================== 自定义端点 =====================

/**
 * POST /api/login
 * Body: { username: string, password: string }
 * 返回: { code, message, data: { token, refreshToken, userInfo } }
 */
server.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空', data: null })
  }

  const db = router.db
  const user = db.get('users').find({ username, password }).value()

  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null })
  }

  const token = generateToken()
  const refreshToken = generateToken()

  tokenStore[token] = {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 小时
  }

  const { password: _, ...userInfo } = user

  res.json({
    code: 200,
    message: '登录成功',
    data: { token, refreshToken, userInfo },
  })
})

/**
 * GET /api/userinfo
 * Header: Authorization: Bearer <token>
 * 返回: { code, message, data: UserInfo }
 */
server.get('/api/userinfo', (req, res) => {
  const session = verifyToken(req)
  if (!session) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期', data: null })
  }

  const db = router.db
  const user = db.get('users').find({ id: session.userId }).value()

  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在', data: null })
  }

  const { password: _, ...userInfo } = user
  res.json({ code: 200, message: 'ok', data: userInfo })
})

/**
 * POST /api/logout
 * Header: Authorization: Bearer <token>
 */
server.post('/api/logout', (req, res) => {
  const token = extractToken(req)
  if (token) delete tokenStore[token]
  res.json({ code: 200, message: '已退出登录', data: null })
})

// ===================== 评分引擎 =====================

/**
 * 五维度评分算法
 * @param {number} systolicBP    - 收缩压 (mmHg)
 * @param {number} diastolicBP   - 舒张压 (mmHg)
 * @param {number} bloodSugar    - 空腹血糖 (mmol/L)
 * @param {number} cholesterol   - 总胆固醇 (mmol/L)
 * @param {number} bmi           - BMI
 * @param {number} sleepHours    - 日均睡眠 (h)
 * @param {number} exerciseFreq  - 每周运动次数
 * @returns {{ cardio, metabolic, nutrition, mental, lifestyle }}
 */
function evaluateScores(systolicBP, diastolicBP, bloodSugar, cholesterol, bmi, sleepHours, exerciseFreq) {
  const cardio    = Math.max(10, 100 - (systolicBP - 120) * 0.8 - (diastolicBP - 80) * 0.5)
  const metabolic = Math.max(10, 100 - (bloodSugar - 5) * 20 - (cholesterol - 4.5) * 15)
  const nutrition = Math.max(10, 100 - Math.abs(bmi - 22) * 6)
  const mental    = Math.max(10, 80 - Math.abs(7 - sleepHours) * 10)
  const lifestyle = Math.max(10, 60 + (exerciseFreq > 1 ? exerciseFreq * 8 : -20))

  return {
    cardio:    +cardio.toFixed(1),
    metabolic: +metabolic.toFixed(1),
    nutrition: +nutrition.toFixed(1),
    mental:    +mental.toFixed(1),
    lifestyle: +lifestyle.toFixed(1),
  }
}

function calcOverall(scores) {
  return +(scores.cardio * 0.3 + scores.metabolic * 0.25 + scores.nutrition * 0.2 + scores.mental * 0.15 + scores.lifestyle * 0.1).toFixed(1)
}

function getLevel(score) {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

function normalizeExerciseFreq(val) {
  if (typeof val === 'string') {
    if (val === '0') return 0
    if (val === '1-2') return 1.5
    if (val === '3-4') return 3.5
    if (val === '5+') return 6
  }
  return Number(val) || 0
}

/**
 * POST /api/questionnaire/submit
 * Body: { userId: number, answers: Answer[] }
 * 返回完整的 RiskReport
 */
server.post('/api/questionnaire/submit', (req, res) => {
  const session = verifyToken(req)
  if (!session) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期', data: null })
  }

  const { userId, answers } = req.body || {}
  if (!userId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ code: 400, message: '参数不完整', data: null })
  }

  const db = router.db

  // 解析答案，按 value 索引
  const answerMap = {}
  for (const a of answers) {
    answerMap[a.questionId] = a.value
  }

  // 提取关键指标
  const systolicBP   = Number(answerMap[21]) || 120    // 收缩压题目
  const diastolicBP  = Number(answerMap[22]) || 80     // 舒张压题目
  const bloodSugar   = Number(answerMap[23]) || 5.0    // 空腹血糖题目
  const cholesterol  = Number(answerMap[24]) || 4.5    // 总胆固醇题目
  const height       = Number(answerMap[3])  || 170    // 身高
  const weight       = Number(answerMap[4])  || 65     // 体重
  const bmi          = +(weight / ((height / 100) ** 2)).toFixed(1)
  const sleepHours   = Number(answerMap[28]) || 7      // 睡眠时长
  const exerciseRaw  = answerMap[27] || '0'            // 运动频率
  const exerciseFreq = normalizeExerciseFreq(exerciseRaw)

  // 更新或创建健康档案
  const existingRecord = db.get('healthRecords').find({ userId }).value()
  const recordData = {
    userId,
    height,
    weight,
    bmi,
    systolicBP,
    diastolicBP,
    bloodSugar,
    totalCholesterol: cholesterol,
    triglycerides: existingRecord?.triglycerides ?? 1.5,
    hdl: existingRecord?.hdl ?? 1.2,
    ldl: existingRecord?.ldl ?? 3.0,
    heartRate: existingRecord?.heartRate ?? 72,
    sleepHours,
    exerciseFrequency: exerciseFreq,
    smokingStatus: existingRecord?.smokingStatus ?? 'never',
    alcoholConsumption: existingRecord?.alcoholConsumption ?? 'none',
    familyHistory: existingRecord?.familyHistory ?? [],
    updatedAt: new Date().toISOString(),
  }

  if (existingRecord) {
    db.get('healthRecords').find({ userId }).assign(recordData).write()
  } else {
    db.get('healthRecords')
      .push({ id: db.get('healthRecords').size().value() + 1, ...recordData, createdAt: new Date().toISOString() })
      .write()
  }

  // 评分
  const scores = evaluateScores(systolicBP, diastolicBP, bloodSugar, cholesterol, bmi, sleepHours, exerciseFreq)
  const overall = calcOverall(scores)
  const level = getLevel(overall)

  // 维度
  const dimensions = [
    { dimension: '心血管健康', score: scores.cardio, level: getLevel(scores.cardio), description: '评估心血管系统功能，主要基于血压指标', indicators: ['收缩压', '舒张压', '心率'] },
    { dimension: '代谢健康',   score: scores.metabolic, level: getLevel(scores.metabolic), description: '评估代谢系统功能，主要基于血糖和血脂', indicators: ['空腹血糖', '总胆固醇', '甘油三酯'] },
    { dimension: '营养状况',   score: scores.nutrition, level: getLevel(scores.nutrition), description: '评估营养水平，主要基于BMI', indicators: ['BMI', '体重', '身高'] },
    { dimension: '心理健康',   score: scores.mental, level: getLevel(scores.mental), description: '评估心理状态，主要基于睡眠和情绪', indicators: ['睡眠时长', '焦虑程度', '压力水平'] },
    { dimension: '生活习惯',   score: scores.lifestyle, level: getLevel(scores.lifestyle), description: '评估生活习惯健康程度', indicators: ['运动频率', '吸烟状况', '饮酒状况'] },
  ]

  const radarData = dimensions.map(d => ({ dimension: d.dimension, score: d.score, maxScore: 100 }))

  // 趋势数据（模拟近6个月）
  const trendData = []
  for (let m = 5; m >= 0; m--) {
    const d = new Date()
    d.setMonth(d.getMonth() - m)
    trendData.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      bloodPressure: +(systolicBP + (Math.random() - 0.5) * 6).toFixed(1),
      bloodSugar: +(bloodSugar + (Math.random() - 0.5) * 0.4).toFixed(1),
      cholesterol: +(cholesterol + (Math.random() - 0.5) * 0.3).toFixed(1),
    })
  }

  // 风险指标
  const riskIndicators = [
    { name: '收缩压', value: systolicBP, normalRange: [90, 140], unit: 'mmHg', level: systolicBP > 140 ? 'abnormal' : systolicBP > 130 ? 'borderline' : 'normal', score: scores.cardio, suggestions: systolicBP > 130 ? ['减少盐摄入', '规律监测血压', '增加有氧运动'] : ['保持当前良好状态'] },
    { name: '舒张压', value: diastolicBP, normalRange: [60, 90], unit: 'mmHg', level: diastolicBP > 90 ? 'abnormal' : diastolicBP > 85 ? 'borderline' : 'normal', score: scores.cardio, suggestions: diastolicBP > 85 ? ['控制体重', '减少压力', '限制饮酒'] : ['保持当前良好状态'] },
    { name: '空腹血糖', value: bloodSugar, normalRange: [3.9, 6.1], unit: 'mmol/L', level: bloodSugar > 7 ? 'abnormal' : bloodSugar > 6.1 ? 'borderline' : 'normal', score: scores.metabolic, suggestions: bloodSugar > 6.1 ? ['减少糖摄入', '增加膳食纤维', '定期检测'] : ['保持均衡饮食'] },
    { name: '总胆固醇', value: cholesterol, normalRange: [2.8, 5.2], unit: 'mmol/L', level: cholesterol > 6.2 ? 'abnormal' : cholesterol > 5.2 ? 'borderline' : 'normal', score: scores.metabolic, suggestions: cholesterol > 5.2 ? ['减少饱和脂肪', '增加不饱和脂肪酸摄入', '增加运动'] : ['保持当前饮食结构'] },
    { name: 'BMI', value: bmi, normalRange: [18.5, 24], unit: 'kg/m²', level: bmi >= 28 ? 'abnormal' : bmi >= 24 ? 'borderline' : 'normal', score: scores.nutrition, suggestions: bmi >= 24 ? ['控制热量摄入', '增加日常活动量', '制定科学减重计划'] : ['保持当前体重'] },
    { name: '静息心率', value: 72, normalRange: [60, 100], unit: 'bpm', level: 'normal', score: 75, suggestions: ['保持良好运动习惯'] },
  ]

  const summaries = {
    excellent: '您的综合健康状况优秀，各项健康指标均在理想范围内，请继续保持当前良好的生活习惯。',
    good: '您的综合健康状况良好，大部分指标在正常范围，部分指标有轻微偏离，建议关注并适当调整生活方式。',
    fair: '您的综合健康状况一般，部分指标偏离正常范围，建议您重视健康管理，寻求专业指导改善相关指标。',
    poor: '您的综合健康状况需要关注，多项指标处于异常范围，强烈建议您尽快就医进行全面检查并制定系统化的健康改善计划。',
  }

  // 生成报告
  const reportId = db.get('reports').size().value() + 1
  const newReport = {
    id: reportId,
    userId,
    overallScore: overall,
    overallLevel: level,
    riskIndicators,
    healthDimensions: dimensions,
    radarData,
    trendData,
    summary: summaries[level],
    generatedAt: new Date().toISOString(),
  }

  db.get('reports').push(newReport).write()

  res.json({
    code: 200,
    message: '评估完成',
    data: newReport,
  })
})

/**
 * GET /api/reports/history/:userId
 * 返回该用户的所有历史报告
 */
server.get('/api/reports/history/:userId', (req, res) => {
  const session = verifyToken(req)
  if (!session) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期', data: null })
  }

  const userId = Number(req.params.userId)
  const db = router.db
  const reports = db.get('reports').filter({ userId }).orderBy('generatedAt', 'desc').value()

  res.json({ code: 200, message: 'ok', data: reports })
})

/**
 * GET /api/plans/:userId
 * 返回该用户的健康方案
 */
server.get('/api/plans/:userId', (req, res) => {
  const session = verifyToken(req)
  if (!session) {
    return res.status(401).json({ code: 401, message: 'Token 无效或已过期', data: null })
  }

  const userId = Number(req.params.userId)
  const db = router.db
  const plans = db.get('healthPlans').filter({ userId }).value()

  res.json({ code: 200, message: 'ok', data: plans })
})

// ===================== json-server 原生路由 =====================

// 响应包装 — 对 json-server 原生 REST 端点统一包装
router.render = (req, res) => {
  const data = res.locals.data
  res.jsonp({
    code: 200,
    message: 'ok',
    data,
  })
}

// 挂载 /api 前缀
server.use('/api', router)

// ===================== 启动 =====================
const PORT = 3001
server.listen(PORT, () => {
  console.log(`[Mock Server] 运行在 http://localhost:${PORT}`)
  console.log(`[Mock Server] 可用端点:`)
  console.log(`  POST /api/login`)
  console.log(`  GET  /api/userinfo`)
  console.log(`  POST /api/logout`)
  console.log(`  GET  /api/questions`)
  console.log(`  POST /api/questionnaire/submit`)
  console.log(`  GET  /api/reports/history/:userId`)
  console.log(`  GET  /api/plans/:userId`)
  console.log(`  GET  /api/users`)
  console.log(`  GET  /api/healthRecords`)
  console.log(`  GET  /api/reports`)
})
