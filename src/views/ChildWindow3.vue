<!-- src/views/ChildWindow1.vue -->
<template>
  <div class="child-window">
    <!-- 自定义标题栏（拖动区） -->
    <div
        class="drag-area"
        @mousedown="handleDragStart"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
    >
      <span class="title">猩🐒的弹幕</span>
    </div>
    <div class="content">
      <h2>这是子窗口3</h2>
      <p>子窗口3的专属内容</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import {onUnmounted, ref} from "vue";

// 1. 开始拖动（鼠标按下）

const windowKey = 'window3'
let isDragging = ref(false) // 是否正在拖动



const handleDragStart = (e: MouseEvent) => {
  isDragging.value = true
  // 发送初始鼠标坐标（屏幕坐标，而非窗口内坐标）
  window.electronAPI.startDrag(windowKey, e.screenX, e.screenY)

  // 全局监听鼠标移动（拖动中）和松开（结束拖动）
  document.addEventListener('mousemove', handleDragging)
  document.addEventListener('mouseup', handleDragEnd)
  document.addEventListener('mouseleave', handleDragEnd)

  e.preventDefault() // 阻止默认行为（比如选中文本）
}
// 2. 拖动中（鼠标移动）
const handleDragging = (e: MouseEvent) => {
  if (!isDragging.value) return
  // 实时发送当前鼠标坐标给主进程
  window.electronAPI.dragging(windowKey, e.screenX, e.screenY)
}
// 3. 结束拖动（鼠标松开/离开）
const handleDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  // 通知主进程结束拖动
  window.electronAPI.stopDrag(windowKey)
  // 移除全局监听
  document.removeEventListener('mousemove', handleDragging)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('mouseleave', handleDragEnd)
}
// 组件卸载清理监听
onUnmounted(() => {
  // 拖动监听清理
  document.removeEventListener('mousemove', handleDragging)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('mouseleave', handleDragEnd)

})
</script>

<style scoped>
.child-window {
  width: 80vw;
  height: 80vh;
  box-sizing: border-box;
  background: transparent;
  border-radius: 8px;
  //background-color: white;
  transition: border-color 0.2s;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}


.drag-area {
  height: 30px;
  line-height: 30px;
  background: rgba(255, 255, 255, 0);
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}
.content {
  height: calc(100% - 50px);
  width: 100%;
  box-sizing: border-box;
  position:relative;
}
.title {
  font-size: 1.5rem;
  color: #000000;
  font-weight: bolder;
}
</style>