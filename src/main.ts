import Vue from 'vue'
import App from './App.vue'
import config from './config'
import VueToast from 'vue-toast-notification'
// Import one of the available themes
// import 'vue-toast-notification/dist/theme-default.css';
import 'vue-toast-notification/dist/theme-sugar.css'
import translations from './translations/translations.json'
import { register_service_worker } from './utils'

register_service_worker()

import vmodal from 'vue-js-modal'
import router from './router'
import VueResizeText from 'vue-resize-text'

Vue.use(VueResizeText)
Vue.use(vmodal)
Vue.use(VueToast)
Vue.config.productionTip = false
Vue.prototype.config = config // <- set config to global scope
Vue.prototype.translations = translations // <- set translations to global scope

/* (global) This code is going to tell us, if history mode can be activated on the client, so the application can be consumed without sessionStorage */
Vue.prototype.history = () => {
  try {
    sessionStorage.getItem('check')
    return true
  } catch {
    return false
  }
}

/* (global) Currently selected language or fallback language (en). Needs to be a function, since it's reactive. No need for vuex there */
Vue.prototype.lang = () => {
  if (Vue.prototype.history()) return sessionStorage.getItem('lang') || config.fallback_lang
  return config.fallback_lang
}

/* (global) Debug mode */
Vue.prototype.debug = () => process.env.NODE_ENV == 'development'

// new Vue({render: h => h(App)}).$mount('#app')

const app = new Vue({
  router,
  render: h => h(App)
})
app.$mount('#app')
