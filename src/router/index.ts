import { createRouter, createWebHashHistory } from 'vue-router'
// 导入拆分后的页面
import MainPage from '../views/MainPage.vue'
import ChildWindow1 from '../views/ChildWindow1.vue'
import ChildWindow2 from '../views/ChildWindow2.vue'
import ChildWindow3 from '../views/ChildWindow3.vue'
import ChildWindow4 from '../views/ChildWindow4.vue'
import ChildWindow5 from '../views/ChildWindow5.vue'
import ConfigWindow from "../views/ConfigWindow.vue";
const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        // 主窗口路由（根路径）
        { path: '/', component: MainPage },
        // 子窗口1路由
        { path: '/child/window1', component: ChildWindow1 },
        // 子窗口2路由
        { path: '/child/window2', component: ChildWindow2 },
        // 子窗口3路由
        { path: '/child/window3', component: ChildWindow3 },
        //子窗口4路由
        { path: '/child/window4', component: ChildWindow4 },
        { path: '/child/window5', component: ChildWindow5 },
        {path: '/child/config', component: ConfigWindow }
    ]
})

export default router