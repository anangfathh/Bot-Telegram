import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/auth'
import Dashboard from '../views/Dashboard.vue'
import Users from '../views/Users.vue'
import Posts from '../views/Posts.vue'
import Ratings from '../views/Ratings.vue'
import Drivers from '../views/Drivers.vue'
import Settings from '../views/Settings.vue'
import Login from '../views/Login.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/users', name: 'Users', component: Users, meta: { requiresAuth: true } },
  { path: '/posts', name: 'Posts', component: Posts, meta: { requiresAuth: true } },
  { path: '/ratings', name: 'Ratings', component: Ratings, meta: { requiresAuth: true } },
  { path: '/drivers', name: 'Drivers', component: Drivers, meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authenticated = isAuthenticated()

  if (to.meta.requiresAuth && !authenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.path === '/login' && authenticated) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
    return redirect
  }

  return true
})

export default router
