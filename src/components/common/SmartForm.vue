<!-- 智能表单组件 -->
<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="computedRules"
    :label-width="labelWidth"
    :size="size"
    :disabled="disabled"
    :validate-on-rule-change="false"
    @submit.prevent="handleSubmit"
    class="smart-form"
    :class="{ 'is-loading': loading }"
  >
    <slot 
      :formData="formData" 
      :validate="validate"
      :resetForm="resetForm"
      :clearValidate="clearValidate"
    />
    
    <!-- 表单操作按钮 -->
    <div v-if="showActions" class="form-actions">
      <el-button
        type="primary"
        :loading="loading"
        :disabled="disabled"
        @click="handleSubmit"
        :size="size"
      >
        <el-icon v-if="!loading"><Check /></el-icon>
        {{ submitText }}
      </el-button>
      
      <el-button
        v-if="showReset"
        :disabled="disabled || loading"
        @click="handleReset"
        :size="size"
      >
        <el-icon><Refresh /></el-icon>
        {{ resetText }}
      </el-button>
      
      <slot name="actions" :formData="formData" :loading="loading" />
    </div>
  </el-form>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'

interface Props<T> {
  modelValue: T
  rules?: FormRules
  labelWidth?: string | number
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  loading?: boolean
  showActions?: boolean
  showReset?: boolean
  submitText?: string
  resetText?: string
  validateOnChange?: boolean
  autoFocus?: string // 自动聚焦的字段名
}

interface Emits<T> {
  'update:modelValue': [value: T]
  'submit': [data: T, isValid: boolean]
  'reset': [data: T]
  'validate': [isValid: boolean, invalidFields?: any]
}

const props = withDefaults(defineProps<Props<T>>(), {
  labelWidth: '120px',
  size: 'default',
  disabled: false,
  loading: false,
  showActions: true,
  showReset: true,
  submitText: '提交',
  resetText: '重置',
  validateOnChange: true
})

const emit = defineEmits<Emits<T>>()

const formRef = ref<FormInstance>()

// 表单数据的本地副本
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 计算后的规则（支持动态规则）
const computedRules = computed(() => {
  if (typeof props.rules === 'function') {
    return (props.rules as any)(formData.value)
  }
  return props.rules
})

// 监听表单数据变化进行验证
watch(
  formData,
  async (newVal) => {
    if (props.validateOnChange && formRef.value) {
      await nextTick()
      try {
        await formRef.value.validate()
        emit('validate', true)
      } catch (error) {
        emit('validate', false, error)
      }
    }
  },
  { deep: true }
)

// 自动聚焦
watch(
  () => props.autoFocus,
  async (fieldName) => {
    if (fieldName && formRef.value) {
      await nextTick()
      const field = formRef.value.$el.querySelector(`[prop="${fieldName}"] input`)
      field?.focus()
    }
  },
  { immediate: true }
)

/**
 * 表单提交处理
 */
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', formData.value, true)
  } catch (error) {
    console.warn('表单验证失败:', error)
    emit('submit', formData.value, false)
    
    // 聚焦到第一个错误字段
    focusFirstError()
  }
}

/**
 * 表单重置处理
 */
const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
    emit('reset', formData.value)
  }
}

/**
 * 验证表单
 */
const validate = async (): Promise<boolean> => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

/**
 * 验证指定字段
 */
const validateField = async (prop: string): Promise<boolean> => {
  if (!formRef.value) return false
  
  return new Promise((resolve) => {
    formRef.value!.validateField(prop, (valid, errorMessage) => {
      resolve(typeof valid === 'boolean' ? valid : valid === '')
    })
  })
}

/**
 * 重置表单
 */
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

/**
 * 清除验证
 */
const clearValidate = (props?: string | string[]) => {
  if (formRef.value) {
    formRef.value.clearValidate(props)
  }
}

/**
 * 聚焦到第一个错误字段
 */
const focusFirstError = async () => {
  await nextTick()
  const firstError = formRef.value?.$el.querySelector('.is-error input, .is-error textarea')
  if (firstError) {
    firstError.focus()
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

/**
 * 设置字段值
 */
const setFieldValue = (field: keyof T, value: any) => {
  const newData = { ...formData.value }
  newData[field] = value
  emit('update:modelValue', newData)
}

/**
 * 获取字段值
 */
const getFieldValue = (field: keyof T) => {
  return formData.value[field]
}

/**
 * 获取字段错误信息
 */
const getFieldError = (field: string): string | null => {
  if (!formRef.value) return null
  
  const fieldComponent = formRef.value.fields.find(f => f.prop === field)
  return fieldComponent?.validateMessage || null
}

/**
 * 批量设置字段值
 */
const setFieldsValue = (fields: Partial<T>) => {
  const newData = { ...formData.value, ...fields }
  emit('update:modelValue', newData)
}

// 暴露方法给父组件
defineExpose({
  formRef,
  validate,
  validateField,
  resetForm,
  clearValidate,
  setFieldValue,
  getFieldValue,
  getFieldError,
  setFieldsValue,
  focusFirstError
})
</script>

<style scoped>
.smart-form {
  width: 100%;
}

.smart-form.is-loading {
  position: relative;
}

.smart-form.is-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  z-index: 1;
  pointer-events: none;
}

.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.form-actions .el-button + .el-button {
  margin-left: 12px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .form-actions {
    text-align: stretch;
  }
  
  .form-actions .el-button {
    width: 100%;
    margin: 0 0 8px 0;
  }
  
  .form-actions .el-button + .el-button {
    margin-left: 0;
  }
}

/* 表单项动画 */
:deep(.el-form-item) {
  transition: all 0.3s ease;
}

:deep(.el-form-item.is-error) {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 聚焦样式增强 */
:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

:deep(.el-textarea.is-focus .el-textarea__inner) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
</style>