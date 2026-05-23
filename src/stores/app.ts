import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // ---- State ----
  const sidebarCollapsed = ref(false)
  const loading = ref(false)
  const pageTitle = ref('')

  // ---- Actions ----
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setLoading(val: boolean): void {
    loading.value = val
  }

  function setPageTitle(title: string): void {
    pageTitle.value = title
    document.title = title ? `${title} - 智能健康管理系统` : '智能健康管理系统'
  }

  return {
    sidebarCollapsed,
    loading,
    pageTitle,
    toggleSidebar,
    setLoading,
    setPageTitle,
  }
})
