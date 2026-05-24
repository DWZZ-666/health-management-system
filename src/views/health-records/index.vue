<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">健康档案</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新增记录
      </el-button>
    </div>

    <div class="table-responsive">
      <el-table :data="records" stripe v-loading="loading" empty-text="暂无健康档案">
      <el-table-column prop="createdAt" label="日期" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column prop="bmi" label="BMI" width="80">
        <template #default="{ row }">
          <el-tag :type="bmiTagType(row.bmi)" size="small">{{ row.bmi }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="血压 (mmHg)" width="140">
        <template #default="{ row }">
          {{ row.systolicBP }}/{{ row.diastolicBP }}
        </template>
      </el-table-column>
      <el-table-column prop="bloodSugar" label="空腹血糖" width="100">
        <template #default="{ row }">{{ row.bloodSugar }} mmol/L</template>
      </el-table-column>
      <el-table-column label="血脂 (mmol/L)" width="200">
        <template #default="{ row }">
          TC {{ row.totalCholesterol }} | TG {{ row.triglycerides }} | HDL {{ row.hdl }} | LDL {{ row.ldl }}
        </template>
      </el-table-column>
      <el-table-column prop="heartRate" label="心率" width="80">
        <template #default="{ row }">{{ row.heartRate }} bpm</template>
      </el-table-column>
      <el-table-column label="睡眠/运动" width="120">
        <template #default="{ row }">
          {{ row.sleepHours }}h / {{ row.exerciseFrequency }}次
        </template>
      </el-table-column>
      <el-table-column label="吸烟/饮酒" width="100">
        <template #default="{ row }">
          <el-tag :type="row.smokingStatus === 'never' ? 'success' : 'warning'" size="small">{{ smokingLabel(row.smokingStatus) }}</el-tag>
          <el-tag :type="row.alcoholConsumption === 'none' ? 'success' : 'warning'" size="small" style="margin-left:2px">{{ alcoholLabel(row.alcoholConsumption) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑健康档案' : '新增健康档案'" width="750px" :close-on-click-modal="false">
      <el-form :model="form" label-width="120px" :rules="formRules" ref="formRef">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="身高(cm)" prop="height">
              <el-input-number v-model="form.height" :min="100" :max="250" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="体重(kg)" prop="weight">
              <el-input-number v-model="form.weight" :min="30" :max="200" :precision="1" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="收缩压(mmHg)" prop="systolicBP">
              <el-input-number v-model="form.systolicBP" :min="60" :max="250" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="舒张压(mmHg)" prop="diastolicBP">
              <el-input-number v-model="form.diastolicBP" :min="30" :max="150" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="空腹血糖(mmol/L)" prop="bloodSugar">
              <el-input-number v-model="form.bloodSugar" :min="2" :max="20" :precision="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总胆固醇(mmol/L)" prop="totalCholesterol">
              <el-input-number v-model="form.totalCholesterol" :min="2" :max="12" :precision="1" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="甘油三酯(mmol/L)">
              <el-input-number v-model="form.triglycerides" :min="0.3" :max="10" :precision="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="HDL胆固醇(mmol/L)">
              <el-input-number v-model="form.hdl" :min="0.3" :max="3" :precision="1" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="LDL胆固醇(mmol/L)">
              <el-input-number v-model="form.ldl" :min="0.5" :max="8" :precision="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="静息心率(bpm)" prop="heartRate">
              <el-input-number v-model="form.heartRate" :min="40" :max="200" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">生活习惯</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="睡眠时长(h)" prop="sleepHours">
              <el-input-number v-model="form.sleepHours" :min="3" :max="16" :precision="0.5" :step="0.5" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每周运动次数" prop="exerciseFrequency">
              <el-input-number v-model="form.exerciseFrequency" :min="0" :max="14" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="吸烟状况" prop="smokingStatus">
              <el-select v-model="form.smokingStatus">
                <el-option label="从不吸烟" value="never" />
                <el-option label="已戒烟" value="former" />
                <el-option label="仍在吸烟" value="current" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="饮酒状况" prop="alcoholConsumption">
              <el-select v-model="form.alcoholConsumption">
                <el-option label="不饮酒" value="none" />
                <el-option label="少量" value="light" />
                <el-option label="中等" value="moderate" />
                <el-option label="大量" value="heavy" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="家族病史">
              <el-checkbox-group v-model="form.familyHistory">
                <el-checkbox label="高血压" value="高血压" />
                <el-checkbox label="糖尿病" value="糖尿病" />
                <el-checkbox label="冠心病" value="冠心病" />
                <el-checkbox label="脑卒中" value="脑卒中" />
                <el-checkbox label="肿瘤" value="肿瘤" />
                <el-checkbox label="其他" value="其他" />
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { calcBMI, formatDate } from '@/utils'
import { getHealthRecordsByUserApi, createHealthRecordApi, updateHealthRecordApi, deleteHealthRecordApi } from '@/api/healthRecord'
import type { HealthRecord } from '@/types'

const appStore = useAppStore()
const userStore = useUserStore()
const loading = ref(false)
const dialogVisible = ref(false)
const editId = ref<number | null>(null)
const formRef = ref()
const records = ref<HealthRecord[]>([])

function getDefaultForm() {
  return {
    height: 170,
    weight: 65,
    systolicBP: 120,
    diastolicBP: 80,
    bloodSugar: 5.5,
    totalCholesterol: 4.8,
    triglycerides: 1.5,
    hdl: 1.2,
    ldl: 3.0,
    heartRate: 72,
    sleepHours: 7,
    exerciseFrequency: 3,
    smokingStatus: 'never' as 'never' | 'former' | 'current',
    alcoholConsumption: 'none' as 'none' | 'light' | 'moderate' | 'heavy',
    familyHistory: [] as string[],
  }
}

const defaultForm = getDefaultForm()

const form = reactive(getDefaultForm())

const formRules = {
  height: [{ required: true, message: '请输入身高' }],
  weight: [{ required: true, message: '请输入体重' }],
  systolicBP: [{ required: true, message: '请输入收缩压' }],
  diastolicBP: [{ required: true, message: '请输入舒张压' }],
  bloodSugar: [{ required: true, message: '请输入空腹血糖' }],
  totalCholesterol: [{ required: true, message: '请输入总胆固醇' }],
  heartRate: [{ required: true, message: '请输入心率' }],
  sleepHours: [{ required: true, message: '请输入睡眠时长' }],
  exerciseFrequency: [{ required: true, message: '请输入运动次数' }],
  smokingStatus: [{ required: true, message: '请选择吸烟状况' }],
  alcoholConsumption: [{ required: true, message: '请选择饮酒状况' }],
}

function bmiTagType(bmi: number): 'success' | 'warning' | 'danger' {
  if (bmi >= 18.5 && bmi < 24) return 'success'
  if (bmi < 28) return 'warning'
  return 'danger'
}

function smokingLabel(s: string): string {
  const map: Record<string, string> = { never: '不吸烟', former: '已戒烟', current: '吸烟' }
  return map[s] || s
}

function alcoholLabel(s: string): string {
  const map: Record<string, string> = { none: '不饮酒', light: '少量', moderate: '中等', heavy: '大量' }
  return map[s] || s
}

function openDialog(row?: HealthRecord) {
  editId.value = null
  if (row) {
    editId.value = row.id
    Object.assign(form, {
      height: row.height,
      weight: row.weight,
      systolicBP: row.systolicBP,
      diastolicBP: row.diastolicBP,
      bloodSugar: row.bloodSugar,
      totalCholesterol: row.totalCholesterol,
      triglycerides: row.triglycerides,
      hdl: row.hdl,
      ldl: row.ldl,
      heartRate: row.heartRate,
      sleepHours: row.sleepHours,
      exerciseFrequency: row.exerciseFrequency,
      smokingStatus: row.smokingStatus,
      alcoholConsumption: row.alcoholConsumption,
      familyHistory: [...row.familyHistory],
    })
  } else {
    Object.assign(form, defaultForm)
    form.familyHistory = []
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const bmi = calcBMI(form.weight, form.height)
  const payload = {
    userId: userStore.userId,
    height: form.height,
    weight: form.weight,
    bmi,
    systolicBP: form.systolicBP,
    diastolicBP: form.diastolicBP,
    bloodSugar: form.bloodSugar,
    totalCholesterol: form.totalCholesterol,
    triglycerides: form.triglycerides,
    hdl: form.hdl,
    ldl: form.ldl,
    heartRate: form.heartRate,
    sleepHours: form.sleepHours,
    exerciseFrequency: form.exerciseFrequency,
    smokingStatus: form.smokingStatus,
    alcoholConsumption: form.alcoholConsumption,
    familyHistory: form.familyHistory,
  }

  try {
    if (editId.value) {
      await updateHealthRecordApi(editId.value, payload)
    } else {
      await createHealthRecordApi(payload)
    }
    dialogVisible.value = false
    ElMessage.success('健康档案已保存')
    await fetchRecords()
  } catch {
    ElMessage.error('保存失败')
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该档案？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteHealthRecordApi(id)
    ElMessage.success('已删除')
    await fetchRecords()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function fetchRecords() {
  loading.value = true
  try {
    const res = await getHealthRecordsByUserApi(userStore.userId)
    records.value = res.data.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  appStore.setPageTitle('健康档案')
  fetchRecords()
})
</script>
