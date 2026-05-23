<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">健康档案</h2>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon><Plus /></el-icon>新增记录
      </el-button>
    </div>

    <!-- 档案列表 -->
    <el-table :data="records" stripe style="width: 100%" v-loading="loading" empty-text="暂无健康档案">
      <el-table-column prop="date" label="日期" width="120" />
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
      <el-table-column label="血脂 (mmol/L)" width="160">
        <template #default="{ row }">
          TC {{ row.totalCholesterol }} | TG {{ row.triglycerides }}
        </template>
      </el-table-column>
      <el-table-column prop="heartRate" label="心率" width="80">
        <template #default="{ row }">{{ row.heartRate }} bpm</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default>
          <el-button type="primary" link size="small">详情</el-button>
          <el-button type="danger" link size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增档案对话框 -->
    <el-dialog v-model="dialogVisible" title="新增健康档案" width="650px" :close-on-click-modal="false">
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
            <el-form-item label="静息心率(bpm)" prop="heartRate">
              <el-input-number v-model="form.heartRate" :min="40" :max="200" controls-position="right" />
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
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { calcBMI } from '@/utils'

interface RecordItem {
  id: number
  date: string
  height: number
  weight: number
  bmi: number
  systolicBP: number
  diastolicBP: number
  bloodSugar: number
  totalCholesterol: number
  triglycerides: number
  heartRate: number
}

const appStore = useAppStore()
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref()

const records = ref<RecordItem[]>([
  {
    id: 1, date: '2025-06-15', height: 175, weight: 78, bmi: 25.5,
    systolicBP: 138, diastolicBP: 88, bloodSugar: 5.8,
    totalCholesterol: 5.6, triglycerides: 2.1, heartRate: 78,
  },
  {
    id: 2, date: '2025-03-10', height: 175, weight: 80, bmi: 26.1,
    systolicBP: 142, diastolicBP: 92, bloodSugar: 6.2,
    totalCholesterol: 6.0, triglycerides: 2.5, heartRate: 82,
  },
])

const form = reactive({
  height: 170,
  weight: 65,
  systolicBP: 120,
  diastolicBP: 80,
  bloodSugar: 5.5,
  totalCholesterol: 4.8,
  triglycerides: 1.5,
  heartRate: 72,
})

const formRules = {
  height: [{ required: true, message: '请输入身高' }],
  weight: [{ required: true, message: '请输入体重' }],
  systolicBP: [{ required: true, message: '请输入收缩压' }],
  diastolicBP: [{ required: true, message: '请输入舒张压' }],
  bloodSugar: [{ required: true, message: '请输入空腹血糖' }],
  totalCholesterol: [{ required: true, message: '请输入总胆固醇' }],
  heartRate: [{ required: true, message: '请输入心率' }],
}

function bmiTagType(bmi: number): 'success' | 'warning' | 'danger' {
  if (bmi >= 18.5 && bmi < 24) return 'success'
  if (bmi < 28) return 'warning'
  return 'danger'
}

function handleSave() {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return
    const bmi = calcBMI(form.weight, form.height)
    records.value.unshift({
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      ...form,
      bmi,
    })
    dialogVisible.value = false
    ElMessage.success('健康档案已保存')
  })
}

onMounted(() => {
  appStore.setPageTitle('健康档案')
})
</script>
