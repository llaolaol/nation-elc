import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
  
  // 自定义规则覆盖
  {
    rules: {
      // 允许any类型（在某些场景下必要）
      '@typescript-eslint/no-explicit-any': 'warn',
      // 允许未使用的变量（特别是在开发阶段）
      '@typescript-eslint/no-unused-vars': 'warn',
      // 允许修改props（在某些Vue组件中可能需要）
      'vue/no-mutating-props': 'warn',
      // 允许空catch块（用于错误处理）
      '@typescript-eslint/no-empty-function': 'off',
    }
  }
)
