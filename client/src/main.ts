import { createPinia } from 'pinia'
import { createApp } from 'vue'

import 'leaflet/dist/leaflet.css'
import './style.css'

import App from './App.vue'
import { reveal } from './directives/reveal'
import router from './router'

const app = createApp(App)

app.directive('reveal', reveal)
app.use(createPinia())
app.use(router)
app.mount('#app')
