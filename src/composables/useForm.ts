// 表单验证管理
import { ref, reactive, computed, watch, readonly } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

export interface UseFormOptions<T> {
  initialValues?: Partial<T>
  rules?: FormRules
  validateOnChange?: boolean
  resetOnSubmit?: boolean
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}

/**
 * 表单状态管理
 */
export function useForm<T extends Record<string, any>>(
  defaultValues: T,
  options: UseFormOptions<T> = {}
) {
  const {
    initialValues = {},
    rules = {},
    validateOnChange = true,
    resetOnSubmit = false
  } = options

  const formRef = ref<FormInstance>()
  const formData = reactive({ ...defaultValues, ...initialValues } as T)
  const errors = ref<Record<string, string[]>>({})
  const touched = ref<Record<string, boolean>>({})
  const submitting = ref(false)

  // 计算属性
  const isValid = computed(() => Object.keys(errors.value).length === 0)
  const isDirty = computed(() => {
    return Object.keys(touched.value).some(key => touched.value[key])
  })

  /**
   * 验证整个表单
   */
  const validate = async (): Promise<FormValidationResult> => {
    if (!formRef.value) {
      return { isValid: false, errors: {} }
    }

    try {
      await formRef.value.validate()
      errors.value = {}
      return { isValid: true, errors: {} }
    } catch (validationErrors: any) {
      const formattedErrors: Record<string, string[]> = {}
      
      if (validationErrors && typeof validationErrors === 'object') {
        Object.keys(validationErrors).forEach(field => {
          const fieldErrors = validationErrors[field]
          if (Array.isArray(fieldErrors)) {
            formattedErrors[field] = fieldErrors.map(error => 
              typeof error === 'string' ? error : error.message
            )
          }
        })
      }
      
      errors.value = formattedErrors
      return { isValid: false, errors: formattedErrors }
    }
  }

  /**
   * 验证单个字段
   */
  const validateField = async (field: keyof T): Promise<boolean> => {
    if (!formRef.value) return false

    return new Promise((resolve) => {
      formRef.value!.validateField(field as string, (isValid, errorMessage) => {
        if (typeof isValid === 'boolean' && isValid) {
          // 移除该字段的错误
          const newErrors = { ...errors.value }
          delete newErrors[field as string]
          errors.value = newErrors
          resolve(true)
        } else {
          // 设置该字段的错误
          const message = typeof isValid === 'string' ? isValid : (errorMessage || '验证失败')
          errors.value = {
            ...errors.value,
            [field as string]: [message] as string[]
          } as Record<string, string[]>
          resolve(false)
        }
      })
    })
  }

  /**
   * 重置表单
   */
  const reset = () => {
    if (formRef.value) {
      formRef.value.resetFields()
    }
    Object.assign(formData, { ...defaultValues, ...initialValues })
    errors.value = {}
    touched.value = {}
  }

  /**
   * 清除验证状态
   */
  const clearValidate = (fields?: string | string[]) => {
    if (formRef.value) {
      formRef.value.clearValidate(fields)
    }
    
    if (fields) {
      const fieldsToClear = Array.isArray(fields) ? fields : [fields]
      const newErrors = { ...errors.value }
      fieldsToClear.forEach(field => {
        delete newErrors[field]
      })
      errors.value = newErrors
    } else {
      errors.value = {}
    }
  }

  /**
   * 设置字段值
   */
  const setFieldValue = (field: keyof T, value: any) => {
    (formData as any)[field] = value
    touched.value[field as string] = true

    if (validateOnChange) {
      validateField(field)
    }
  }

  /**
   * 批量设置字段值
   */
  const setFieldsValue = (values: Partial<T>) => {
    Object.keys(values).forEach(key => {
      const field = key as keyof T
      setFieldValue(field, values[field])
    })
  }

  /**
   * 获取字段值
   */
  const getFieldValue = (field: keyof T) => {
    return (formData as any)[field]
  }

  /**
   * 获取字段错误
   */
  const getFieldError = (field: keyof T): string[] => {
    return errors.value[field as string] || []
  }

  /**
   * 检查字段是否有错误
   */
  const hasFieldError = (field: keyof T): boolean => {
    return getFieldError(field).length > 0
  }

  /**
   * 标记字段为已触摸
   */
  const touchField = (field: keyof T) => {
    touched.value[field as string] = true
  }

  /**
   * 检查字段是否已触摸
   */
  const isFieldTouched = (field: keyof T): boolean => {
    return touched.value[field as string] || false
  }

  /**
   * 提交表单
   */
  const submit = async <R = any>(
    submitFn: (data: T) => Promise<R>
  ): Promise<{ success: boolean; data?: R; error?: Error }> => {
    submitting.value = true

    try {
      const validationResult = await validate()
      
      if (!validationResult.isValid) {
        return { success: false }
      }

      const result = await submitFn({ ...formData } as T)
      
      if (resetOnSubmit) {
        reset()
      }

      return { success: true, data: result }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return { success: false, error: err }
    } finally {
      submitting.value = false
    }
  }

  // 监听表单数据变化
  if (validateOnChange) {
    Object.keys(formData).forEach(key => {
      watch(
        () => (formData as any)[key],
        () => {
          touched.value[key] = true
          validateField(key as keyof T)
        }
      )
    })
  }

  return {
    formRef,
    formData: readonly(formData),
    errors: readonly(errors),
    touched: readonly(touched),
    submitting: readonly(submitting),
    isValid,
    isDirty,
    validate,
    validateField,
    reset,
    clearValidate,
    setFieldValue,
    setFieldsValue,
    getFieldValue,
    getFieldError,
    hasFieldError,
    touchField,
    isFieldTouched,
    submit
  }
}