<template>
  <div class="page-card">
    <div class="page-header">
      <h2 class="page-title">健康档案管理</h2>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="8">
        <el-input v-model="searchKeyword" placeholder="搜索用户名" clearable />
      </el-col>
    </el-row>

    <el-table :data="records" stripe v-loading="loading" empty-text="暂无档案数据">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="userName" label="用户" width="100" />
      <el-table-column prop="bmi" label="BMI" width="80">
        <template #default="{ row }">
          <el-tag :type="row.bmi >= 18.5 && row.bmi < 24 ? 'success' : 'warning'" size="small">{{ row.bmi }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="血压" width="140">
        <template #default="{ row }">{{ row.systolicBP }}/{{ row.diastolicBP }} mmHg</template>
      </el-table-column>
      <el-table-column label="空腹血糖" width="100">
        <template #default="{ row }">{{ row.bloodSugar }} mmol/L</template>
      </el-table-column>
      <el-table-column label="总胆固醇" width="100">
        <template #default="{ row }">{{ row.totalCholesterol }} mmol/L</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="120" />
      <el-table-column label="操作" fixed="right" width="120">
        <template #default>
          <el-button type="primary" link size="small">查看</el-button>
          <el-button type="danger" link size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="10"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const loading = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const total = ref(0)

const records = ref([
  { id: 1, userName: '张三', bmi: 25.5, systolicBP: 138, diastolicBP: 88, bloodSugar: 5.8, totalCholesterol: 5.6, createdAt: '2025-06-15' },
  { id: 2, userName: '李四', bmi: 24.2, systolicBP: 130, diastolicBP: 85, bloodSugar: 5.4, totalCholesterol: 4.9, createdAt: '2025-06-14' },
  { id: 3, userName: '王五', bmi: 22.1, systolicBP: 118, diastolicBP: 76, bloodSugar: 5.1, totalCholesterol: 4.5, createdAt: '2025-06-13' },
])

onMounted(() => {
  appStore.setPageTitle('健康档案管理')
  total.value = records.value.length
})
</script>
