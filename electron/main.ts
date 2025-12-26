import { app, BrowserWindow, ipcMain, session } from 'electron'
// 关键：禁用窗口跟随系统暗黑主题
app.commandLine.appendSwitch('force-dark-mode', 'false');
// 或强制使用浅色模式
app.commandLine.appendSwitch('disable-dark-mode');

import path from 'path'
import { fileURLToPath } from 'url'
// 1. 导入electron-store
import Store from 'electron-store';
const store = new Store({
  name: 'app-total-config', // 配置文件名（最终生成 app-total-config.json）
  defaults: {
    // 礼物播报模块默认配置（与你的业务一致）
    giftBroadcast: {
      global: {
        mediaType: 'gif',
        mediaPath: '',
        volume: 1,
        rate: 1,
        pitch: 1,
        delay: 1500,
        defaultTemplate: '感谢{{uname}}赠送了{{num}}个{{gift_name}}',
        windowTitle: '主播的感谢',
        titleBarOpacity: 1,
        windowBgColor: 'rgba(0, 0, 0, 1)',
        userInfoColor: 'rgba(255, 255, 255, 1)',
        isBuffed: false,
        isUserInfo: true,
      },
      exclusiveGift: {} as Record<string, { mediaType: 'gif'|'mp4', mediaPath: string, exclusiveTemplate: string }>
    },
    shipLoad:{
      global: {
        isMuted: false,
        windowTitle: '主播的舰长',
        titleBarOpacity: 1,
        isUserInfo: true,
        windowBgColor: 'rgba(0, 0, 0, 1)',
        userInfoColor: 'rgba(0, 0, 0, 1)'
      },
      media: []
    },
    specialDanmku:{
      global: {
        isMuted: false,
        isUserInfo: true,
        windowTitle: '主播的弹幕',
        titleBarOpacity: 1,
      },
      exclusiveDanmku: {} as Record<string, { mediaPath: string, exclusiveTemplate: string }>
    }
  }
});
const configAPI = {
  getModuleConfig: (moduleKey: string) => store.get(moduleKey),
  saveModuleConfig: (moduleKey: string, moduleConfig: any) => store.set(moduleKey, moduleConfig),
  getConfigItem: (itemKey: string) => store.get(itemKey),
  setConfigItem: (itemKey: string, value: any) => store.set(itemKey, value)
};

ipcMain.handle('config:getModule', (_, moduleKey) => {
  return configAPI.getModuleConfig(moduleKey);
});

ipcMain.handle('config:saveModule', (_, moduleKey, moduleConfig) => {
  configAPI.saveModuleConfig(moduleKey, moduleConfig);
});

ipcMain.handle('config:getItem', (_, itemKey) => {
  return configAPI.getConfigItem(itemKey);
});

ipcMain.handle('config:setItem', (_, itemKey, value) => {
  configAPI.setConfigItem(itemKey, value);
});





// 解决TS中__dirname的问题
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 主窗口实例
let mainWindow: BrowserWindow | null = null
// 多子窗口实例（key: 窗口标识，value: 窗口实例）
const childWindows = new Map<string, BrowserWindow>()
const dragState = new Map<string, {
  startX: number,
  startY: number,
  winX: number,
  winY: number
}>()

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    frame: true,
    autoHideMenuBar: true,
    transparent: true,
    resizable: true,
    icon:path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      webSecurity: false, // 临时关闭web安全策略（允许加载外部图片）
      preload: path.join(__dirname, '../dist-electron/preload.mjs'),
      contextIsolation: true,
      allowRunningInsecureContent: true, // 允许加载HTTP资源（如果有的话）
      nodeIntegration: false
    }
  })

  // 加载页面
  if (import.meta.env.DEV) {
    mainWindow.loadURL(import.meta.env.VITE_DEV_SERVER_URL!)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 主窗口关闭时销毁所有子窗口
  mainWindow.on('closed', () => {
    // 遍历销毁所有子窗口
    childWindows.forEach((win) => win.destroy())
    childWindows.clear()
    mainWindow = null
  })
}

// 创建指定的子窗口
function createChildWindow(windowKey: string) {
  // 避免重复创建
  if (childWindows.has(windowKey) && !childWindows.get(windowKey)?.isDestroyed()) {
    childWindows.get(windowKey)?.focus()
    return
  }

  // 子窗口配置（可根据windowKey自定义不同窗口的大小/标题/路径）
  const windowConfig = {
    'window1': { width: 400, height: 300, title: '上舰动画' },
    'window2': { width: 500, height: 400, title: '礼物统计' },
    'window3': { width: 600, height: 500, title: '特殊弹幕' },
    'window4': { width: 400, height: 400, title: '礼物抽奖' },
    'window5': { width: 400, height: 400, title: '礼物播报' },
    'config':{width: 800,height: 600,title:'配置页面'}
  }[windowKey] || { width: 400, height: 300, title: '默认子窗口' }

  const childWindow = new BrowserWindow({
    width: windowConfig.width,
    height: windowConfig.height,
    modal: false, // 非模态（可同时操作主窗口）
    title: windowConfig.title,
    transparent: true, // 必须开启窗口透明
    frame: false,
    movable: true,
    alwaysOnTop: true,

    backgroundColor: '#00000000',
    // 窗口可调整大小
    resizable: true,
    webPreferences: {
      allowRunningInsecureContent: true, // 允许加载HTTP资源（如果有的话）
      webSecurity: false, // 临时关闭web安全策略（允许加载外部图片）
      preload: path.join(__dirname, '../dist-electron/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: true
    }
  })

  // 子窗口加载不同页面（通过hash路由区分）
  if (import.meta.env.DEV) {
    childWindow.loadURL(`${import.meta.env.VITE_DEV_SERVER_URL}#/child/${windowKey}`)
  } else {
    childWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: `child/${windowKey}`
    })
  }

  // 1. 监听「开始拖动」
  ipcMain.on('start-drag', (_, windowKey: string, startX: number, startY: number) => {
    const win = childWindows.get(windowKey)
    if (!win || win.isDestroyed()) return

    // 记录初始状态：鼠标初始坐标 + 窗口初始位置
    const bounds = win.getBounds()
    dragState.set(windowKey, {
      startX: startX,
      startY: startY,
      winX: bounds.x,
      winY: bounds.y
    })
  })

  // 2. 监听「拖动中」（核心：计算偏移并移动窗口）
  ipcMain.on('dragging', (_, windowKey: string, currentX: number, currentY: number) => {
    const state = dragState.get(windowKey)
    const win = childWindows.get(windowKey)
    if (!state || !win || win.isDestroyed()) return

    // 计算鼠标偏移量
    const deltaX = currentX - state.startX
    const deltaY = currentY - state.startY

    // 移动窗口（仅修改位置，保持大小不变）
    win.setBounds({
      x: state.winX + deltaX,
      y: state.winY + deltaY,
      width: win.getBounds().width,
      height: win.getBounds().height
    })
  })

  // 3. 监听「结束拖动」（清空状态）
  ipcMain.on('stop-drag', (_, windowKey: string) => {
    dragState.delete(windowKey)
  })

  ipcMain.on('resize-window', (_, windowKey: string, direction: string, delta: { x: number, y: number }) => {
    const win = childWindows.get(windowKey)
    if (!win || win.isDestroyed()) return

    const bounds = win.getBounds()
    let { x, y, width, height } = bounds
    switch (direction) {
      case 'right': width = Math.max(200, width + delta.x); break
      case 'bottom': height = Math.max(150, height + delta.y); break
      case 'bottom-right':
        width = Math.max(200, width + delta.x)
        height = Math.max(150, height + delta.y)
        break
      case 'left':
        width = Math.max(200, width - delta.x)
        x += delta.x
        break
      case 'top':
        height = Math.max(150, height - delta.y)
        y += delta.y
        break
    }
    win.setBounds({ x, y, width, height })
  })

  // 子窗口关闭时从Map中移除
  childWindow.on('closed', () => {
    childWindows.delete(windowKey)
  })
  childWindow.center()
  // 将子窗口存入Map
  childWindows.set(windowKey, childWindow)
}

// 关闭指定的子窗口
function closeChildWindow(windowKey: string) {
  const win = childWindows.get(windowKey)
  if (win && !win.isDestroyed()) {
    win.close()
    childWindows.delete(windowKey)
  }
}

// ========== 关键修改1：将消息推送监听移到createChildWindow外部（避免重复注册） ==========
// 精准定向推送消息：向指定windowKey的子窗口发送专属消息
ipcMain.on('send-data-to-child', (_, targetWindowKey, data) => {
  // 1. 只获取目标窗口，不向其他窗口扩散
  const targetWin = childWindows.get(targetWindowKey)

  if (targetWin && !targetWin.isDestroyed()) {
    // 2. 向目标窗口发送「专属通道消息」，仅该窗口能收到
    targetWin.webContents.send(`data-for-${targetWindowKey}`, data)
  } else {
    console.warn(`${targetWindowKey} 不存在或已关闭，跳过推送`)
  }
})

// IPC监听：打开指定子窗口
ipcMain.handle('open-child-window', (_, windowKey: string) => {
  createChildWindow(windowKey)
})

// IPC监听：关闭指定子窗口
ipcMain.handle('close-child-window', (_, windowKey: string) => {
  closeChildWindow(windowKey)
})

// IPC监听：关闭所有子窗口
ipcMain.handle('close-all-child-windows', () => {
  childWindows.forEach((win) => win.close())
  childWindows.clear()
})

// 新增：监听获取窗口大小/位置事件
ipcMain.handle('get-window-bounds', (_, windowKey: string) => {
  const win = childWindows.get(windowKey)
  return win ? win.getBounds() : null
})

// 应用生命周期
app.whenReady().then(() => {
  // 拦截所有图片请求，添加B站允许的请求头
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // 只拦截B站头像/礼物图片的请求
    if (details.url.includes('hdslb.com/bfs/face/') || details.url.includes('hdslb.com/bfs/live/')) {
      details.requestHeaders['Referer'] = 'https://live.bilibili.com/' // 关键：添加B站直播页Referer
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' // 模拟浏览器UA
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders })
  })
  createMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})