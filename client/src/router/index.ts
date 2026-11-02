import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'
import { homePathForRole } from '@/utils/roleHome'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/public/LandingView.vue'),
        },
        {
          path: 'catalog',
          name: 'catalog',
          component: () => import('@/views/public/CatalogView.vue'),
        },
        {
          path: 'stores/:id',
          name: 'store-detail',
          component: () => import('@/views/public/StoreDetailView.vue'),
          props: true,
        },
        {
          path: 'auth/login',
          name: 'login',
          component: () => import('@/views/auth/LoginView.vue'),
          meta: { guestOnly: true },
        },
        {
          path: 'auth/register',
          name: 'register',
          component: () => import('@/views/auth/RegisterView.vue'),
          meta: { guestOnly: true },
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/layouts/CustomerLayout.vue'),
      meta: { requiresAuth: true, roles: ['CUSTOMER'] },
      children: [
        {
          path: 'checkout/:tierId',
          name: 'checkout',
          component: () => import('@/views/customer/CheckoutView.vue'),
          props: true,
        },
        {
          path: 'payment/:orderId',
          name: 'payment',
          component: () => import('@/views/customer/PaymentView.vue'),
          props: true,
        },
        {
          path: 'ticket/:orderId',
          name: 'ticket',
          component: () => import('@/views/customer/TicketView.vue'),
          props: true,
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/customer/OrdersView.vue'),
        },
        {
          path: 'orders/:orderId/feedback',
          name: 'order-feedback',
          component: () => import('@/views/customer/FeedbackView.vue'),
          props: true,
        },
      ],
    },
    {
      path: '/merchant',
      component: () => import('@/layouts/MerchantLayout.vue'),
      meta: { requiresAuth: true, roles: ['MERCHANT'] },
      children: [
        {
          path: '',
          name: 'merchant-dashboard',
          component: () => import('@/views/merchant/DashboardView.vue'),
        },
        {
          path: 'stock',
          name: 'merchant-stock',
          component: () => import('@/views/merchant/StockView.vue'),
        },
        {
          path: 'verify',
          name: 'merchant-verify',
          component: () => import('@/views/merchant/VerifyPinView.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
      children: [
        {
          path: '',
          name: 'admin-merchants',
          component: () => import('@/views/admin/MerchantsView.vue'),
        },
        {
          path: 'monitoring',
          name: 'admin-monitoring',
          component: () => import('@/views/admin/MonitoringView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      return {
        el: to.hash,
        top: 96,
        behavior: reduceMotion ? 'auto' : 'smooth',
      }
    }

    if (savedPosition) {
      return { ...savedPosition, behavior: 'instant' }
    }

    return { top: 0, behavior: 'instant' }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const allowedRoles = to.meta.roles as Role[] | undefined

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.requiresAuth && !auth.user) {
    auth.logout()
    return { name: 'login' }
  }

  if (allowedRoles && (!auth.role || !allowedRoles.includes(auth.role))) {
    return { path: homePathForRole(auth.role) }
  }

  if (to.meta.guestOnly && auth.isAuthenticated && auth.user) {
    return { path: homePathForRole(auth.role) }
  }

  return true
})

export default router
