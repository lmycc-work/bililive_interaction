import { ipcRenderer, contextBridge } from 'electron'

// WebSocket 客户端实例（全局）
let ws: WebSocket | null = null

// 暴露多窗口管理API
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开指定子窗口（传窗口标识）
  openChildWindow: (windowKey: string) => ipcRenderer.invoke('open-child-window', windowKey),
  // 关闭指定子窗口（传窗口标识）
  closeChildWindow: (windowKey: string) => ipcRenderer.invoke('close-child-window', windowKey),
  // 关闭所有子窗口
  closeAllChildWindows: () => ipcRenderer.invoke('close-all-child-windows'),
  // ========== 新增/修改拖动相关API ==========
  // 1. 通知主进程：开始拖动（传入初始鼠标坐标）
  startDrag: (windowKey: string, startX: number, startY: number) => {
    ipcRenderer.send('start-drag', windowKey, startX, startY)
  },
  // 2. 通知主进程：拖动中（传入当前鼠标坐标）
  dragging: (windowKey: string, currentX: number, currentY: number) => {
    ipcRenderer.send('dragging', windowKey, currentX, currentY)
  },
  // 3. 通知主进程：结束拖动
  stopDrag: (windowKey: string) => {
    ipcRenderer.send('stop-drag', windowKey)
  },
  // 新增：获取窗口当前大小/位置（用于缩放计算）
  getWindowBounds: (windowKey: string) => ipcRenderer.invoke('get-window-bounds', windowKey),

  // 1. 连接 Python WebSocket 服务
  connectLiveServer: (onMessage: (data: any) => void) => {
    // 关闭原有连接
    if (ws) {
      ws.close()
      ws = null
    }

    // 建立新连接
    ws = new WebSocket('ws://localhost:8765')

    // 连接成功
    ws.onopen = () => {
      console.log('已连接到B站直播间监听服务')
    }

    // 接收数据
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data) // 把数据传递给渲染进程
      } catch (e) {
        console.error('解析WebSocket数据失败：', e)
      }
    }

    // 连接关闭
    ws.onclose = (event) => {
      console.log('直播间监听服务连接关闭：', event.code, event.reason)
      // 自动重连（可选）
      setTimeout(() => {
        window.electronAPI.connectLiveServer(onMessage)
      }, 3000)
    }

    // 连接错误
    ws.onerror = (error) => {
      console.error('WebSocket连接错误：', error)
    }
  },

  // 2. 关闭 WebSocket 连接
  disconnectLiveServer: () => {
    if (ws) {
      ws.close()
      ws = null
    }
  },


  // ========== 新增：精准推送/监听API ==========
  // 主窗口：向指定子窗口推送数据
  sendDataToChild: (targetWindowKey:string, data:any) => ipcRenderer.send('send-data-to-child', targetWindowKey, data),
  // 子窗口：监听自身专属通道的消息（根据windowKey）
  onExclusiveChildData: (windowKey:string, callback:any) => {
    const channel = `data-for-${windowKey}`
    ipcRenderer.on(channel, (_, data) => callback(data))
    // 返回移除监听的方法，方便子窗口清理
    return () => ipcRenderer.removeListener(channel, (_, data) => callback(data))
  },
  // 子窗口：移除自身专属通道的监听
  offExclusiveChildData: (windowKey:string, callback:any) => {
    const channel = `data-for-${windowKey}`
    ipcRenderer.removeListener(channel, (_, data) => callback(data))
  },



  offLiveData: () => {
    ipcRenderer.removeAllListeners('live-data')
  }
})

// TS类型声明
declare global {
  interface Window {
    electronAPI: {
      openChildWindow: (windowKey: string) => Promise<void>
      closeChildWindow: (windowKey: string) => Promise<void>
      closeAllChildWindows: () => Promise<void>
      getWindowBounds: (windowKey: string) => Promise<Electron.Rectangle>
      startDrag: (windowKey: string, startX: number, startY: number) => void
      dragging: (windowKey: string, currentX: number, currentY: number) => void
      stopDrag: (windowKey: string) => void
      disconnectLiveServer?: () => void;
      connectLiveServer: (callback: (data: any) => void) => void;
      onExclusiveChildData: (windowKey:string, callback:any) => void;
      sendDataToChild: (targetWindowKey: string, data: any) => void;
    }
  }
}