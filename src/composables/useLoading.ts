// 通用加载状态管理
import { ref, computed, readonly } from 'vue'

export interface LoadingState {
  loading: boolean
  error: Error | null
  data: any
}

export interface UseLoadingOptions {
  initialLoading?: boolean
  throwOnError?: boolean
}

/**
 * 用于管理异步操作的加载状态
 */
export function useLoading<T = any>(options: UseLoadingOptions = {}) {
  const { initialLoading = false, throwOnError = false } = options
  
  const loading = ref(initialLoading)
  const error = ref<Error | null>(null)
  const data = ref<T>()

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const hasData = computed(() => data.value !== undefined)

  /**
   * 执行异步操作
   */
  const execute = async <R = T>(asyncFn: () => Promise<R>): Promise<R | undefined> => {
    loading.value = true
    error.value = null

    try {
      const result = await asyncFn()
      data.value = result as unknown as T
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      error.value = errorObj
      
      if (throwOnError) {
        throw errorObj
      }
      
      return undefined
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    loading.value = false
    error.value = null
    data.value = undefined
  }

  /**
   * 设置加载状态
   */
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  /**
   * 设置错误状态
   */
  const setError = (err: Error | string | null) => {
    error.value = err instanceof Error ? err : (err ? new Error(err) : null)
  }

  /**
   * 设置数据
   */
  const setData = (newData: T) => {
    data.value = newData
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    data: readonly(data),
    isLoading,
    hasError,
    hasData,
    execute,
    reset,
    setLoading,
    setError,
    setData
  }
}