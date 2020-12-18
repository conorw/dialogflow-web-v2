import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import PageNotFound from '../views/404.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/training',
        name: 'training',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "Training" */ '../views/Training.vue')
    },
    { path: '/404', component: PageNotFound },
    { path: '*', redirect: '/404' }
]

const router = new VueRouter({
    routes
})

export default router
