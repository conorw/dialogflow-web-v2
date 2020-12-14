import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Training from '../views/Training.vue'
import PageNotFound from '../views/404.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        component: Training
    },
    {
        path: '/home1',
        name: 'Home1',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "home-1" */ '../views/Home1.vue')
    },
    { path: '/404', component: PageNotFound },
    { path: '*', redirect: '/404' }
]

const router = new VueRouter({
    routes
})

export default router
