import { createApp } from 'vue'
import './style.css'
import router from './router'
import App from './App.vue'
import ElementPlus from 'element-plus' // 引入Element Plus
import 'element-plus/dist/index.css' // 引入Element Plus样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 全局注册图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(ElementPlus)
app.use(router).mount('#app')
