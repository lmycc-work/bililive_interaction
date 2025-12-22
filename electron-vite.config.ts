// electron-vite.config.ts（若不存在则新建）
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    main: {
        // 主进程入口
        entry: 'electron/main.ts'
    },
    preload: {
        // 预加载脚本入口（必须配置，否则不会被打包）
        entry: 'electron/preload.ts'
    },
    renderer: {
        plugins: [vue()]
    }
})