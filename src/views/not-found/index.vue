<template>
  <div class="not-found">
    <div class="nf-code">404</div>
    <h1 class="nf-title">页面未找到</h1>
    <p class="nf-desc">您访问的页面不存在或已被移除</p>
    <el-button type="primary" @click="goHome">返回首页</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}
</script>

<style scoped lang="scss">
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.nf-code {
  font-size: 96px;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
  margin-bottom: 16px;
}

.nf-title {
  font-size: 22px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.nf-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
</style>
