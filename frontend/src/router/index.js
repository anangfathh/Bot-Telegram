import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Users from '../views/Users.vue'
import Posts from '../views/Posts.vue'
import Ratings from '../views/Ratings.vue'
import Drivers from '../views/Drivers.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/users', name: 'Users', component: Users },
  { path: '/posts', name: 'Posts', component: Posts },
  { path: '/ratings', name: 'Ratings', component: Ratings },
  { path: '/drivers', name: 'Drivers', component: Drivers },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
