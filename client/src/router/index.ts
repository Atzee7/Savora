import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

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
      meta: { requiresAuth: true },
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
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'orders' }
  }

  return true
})

export default router
