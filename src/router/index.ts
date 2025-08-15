import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/documents',
      name: 'DocumentManagement',
      component: () => import('../views/DocumentManagement.vue'),
    },
    {
      path: '/fault-tree',
      name: 'FaultTreePreview',
      component: () => import('../views/FaultTreePreview.vue'),
    },
    {
      path: '/diagnosis',
      name: 'FaultDiagnosis',
      component: () => import('../views/FaultDiagnosis.vue'),
    },
    {
      path: '/history',
      name: 'DiagnosisHistory',
      component: () => import('../views/DiagnosisHistory.vue'),
    },
    {
      path: '/image-diagnosis',
      name: 'ImageDiagnosis',
      component: () => import('../views/ImageDiagnosis.vue'),
    },
    {
      path: '/test',
      name: 'TestPage',
      component: () => import('../views/TestView.vue'),
    },
  ],
})

export default router
