<template>
  <div class="questionnaire-card">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">健康风险评估问卷</h2>
        <el-steps :active="currentStep" align-center style="flex:1;max-width:600px">
          <el-step v-for="cat in categories" :key="cat" :title="cat" />
        </el-steps>
      </div>

      <!-- 加载状态 -->
      <el-skeleton :loading="loading" animated :count="5" :throttle="200">
        <template #default>
          <!-- 按分类分步 -->
          <div v-for="(category, catIdx) in categories" :key="category" v-show="catIdx === currentStep">
            <div
              v-for="question in questionsByCategory(category)"
              :key="question.id"
              class="question-item"
            >
              <div class="question-title">
                {{ question.id }}. {{ question.title }}
                <span v-if="question.required" class="required">*</span>
              </div>

              <!-- 单选题 -->
              <el-radio-group
                v-if="question.type === 'single'"
                v-model="answers[question.id]"
                @change="onAnswerChange(question.id)"
              >
                <el-radio
                  v-for="opt in question.options"
                  :key="String(opt.value)"
                  :value="opt.value"
                  class="question-option"
                >
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>

              <!-- 多选题 -->
              <el-checkbox-group
                v-else-if="question.type === 'multiple'"
                v-model="answers[question.id]"
                @change="onAnswerChange(question.id)"
              >
                <el-checkbox
                  v-for="opt in question.options"
                  :key="String(opt.value)"
                  :value="opt.value"
                  :label="String(opt.value)"
                  class="question-option"
                >
                  {{ opt.label }}
                </el-checkbox>
              </el-checkbox-group>

              <!-- 数值输入题 -->
              <div v-else-if="question.type === 'number'" style="max-width:300px">
                <el-input-number
                  v-model="answers[question.id]"
                  :min="question.min ?? 0"
                  :max="question.max ?? 999"
                  :precision="question.unit?.includes('mmol') ? 1 : 0"
                  controls-position="right"
                  style="width:100%"
                  @change="onAnswerChange(question.id)"
                />
                <span v-if="question.unit" style="margin-left:8px;color:var(--text-secondary)">{{ question.unit }}</span>
              </div>

              <!-- 量表题（Likert） -->
              <div v-else-if="question.type === 'scale'">
                <el-radio-group
                  v-model="answers[question.id]"
                  @change="onAnswerChange(question.id)"
                >
                  <el-radio-button
                    v-for="opt in question.options"
                    :key="String(opt.value)"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>

      <!-- 步骤导航 -->
      <div class="step-actions">
        <el-button
          v-if="currentStep > 0"
          @click="currentStep--"
          :icon="ArrowLeft"
        >
          上一步
        </el-button>
        <el-button
          v-if="currentStep < categories.length - 1"
          type="primary"
          @click="handleNext"
          :icon="ArrowRight"
          style="margin-left:auto"
        >
          下一步
        </el-button>
        <el-button
          v-else
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
          style="margin-left:auto"
        >
          {{ submitting ? '评估中...' : '提交问卷' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import type { Question, Answer } from '@/types'
import { getQuestionsApi, submitQuestionnaireApi } from '@/api/questionnaire'
import { useUserStore } from '@/stores/user'
import { useReportStore } from '@/stores/report'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const userStore = useUserStore()
const reportStore = useReportStore()
const appStore = useAppStore()

const loading = ref(true)
const submitting = ref(false)
const currentStep = ref(0)
const questions = ref<Question[]>([])
const answers = reactive<Record<number, any>>({})

// 以数组方式组织的分类步骤
const categories = computed(() => {
  const cats = new Set(questions.value.map((q) => q.category))
  return Array.from(cats)
})

function questionsByCategory(category: string): Question[] {
  return questions.value.filter((q) => q.category === category)
}

function onAnswerChange(_questionId: number) {
  // 预留：前端校验、关联逻辑等
}

/** 校验当前步骤必填项 */
function validateCurrentStep(): boolean {
  const currentQuestions = questionsByCategory(categories.value[currentStep.value])
  for (const q of currentQuestions) {
    if (q.required) {
      const val = answers[q.id]
      if (val === undefined || val === null || val === '') {
        ElMessage.warning(`请完成必填项：${q.title}`)
        return false
      }
    }
  }
  return true
}

function handleNext() {
  if (validateCurrentStep()) {
    currentStep.value++
  }
}

async function handleSubmit() {
  if (!validateCurrentStep()) return

  // 构造 Answer 数组
  const answerList: Answer[] = Object.entries(answers).map(([qId, val]) => ({
    questionId: Number(qId),
    value: val,
  }))

  submitting.value = true
  try {
    const res = await submitQuestionnaireApi({
      userId: userStore.userId,
      answers: answerList,
    })
    reportStore.setCurrentReport(res.data)
    ElMessage.success('评估完成，正在跳转报告页')
    router.push('/report')
  } catch {
    ElMessage.error('评估失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  appStore.setPageTitle('风险评估问卷')
  try {
    const res = await getQuestionsApi()
    questions.value = res.data
    // 初始化答案
    res.data.forEach((q) => {
      if (q.type === 'multiple') {
        answers[q.id] = []
      } else if (q.type === 'number') {
        answers[q.id] = undefined
      } else {
        answers[q.id] = ''
      }
    })
  } catch {
    ElMessage.error('加载问卷失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.question-option {
  display: block;
  margin: 8px 0;
  height: auto;
  line-height: 1.5;
  white-space: normal;
}

.step-actions {
  display: flex;
  align-items: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}
</style>
