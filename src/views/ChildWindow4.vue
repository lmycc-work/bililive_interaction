<template>
  <div
      class="drag-area"
      @mousedown="handleDragStart"
      @mouseup="handleDragEnd"
      @mouseleave="handleDragEnd"
  >
      <span class="title">猩🐒的礼物

      </span>
  </div>
  <div class="child-window">
    <div class="box">
      <span v-for="(item, index) in 16" :key="index" class="grid-item">
        {{ index + 1 }}{{item}} <!-- 显示格子序号，方便验证 -->
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onUnmounted, ref} from "vue";

// 1. 开始拖动（鼠标按下）

const windowKey = 'window4'
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
  transition: border-color 0.2s;
  overflow: hidden;
  position: relative;
  padding: 0;
  margin: 0;
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
.title {
  font-size: 1.5rem;
  color: #000000;
  font-weight: bolder;
}
.box{
  height: 100%;
  width: 100%;
  background-color: #888888;
  /* 核心：Grid 布局划分 4*4 网格 */
  display: grid;
  /* 4列，每列宽度均分（25%） */
  grid-template-columns: repeat(4, 1fr);
  /* 4行，每行高度均分（25%） */
  grid-template-rows: repeat(4, 1fr);
  /* 可选：格子间的间距，根据需求调整 */
  gap: 0;
  /* 确保网格占满容器 */
  box-sizing: border-box;

}
.grid-item {
  /* 转为块级元素，支持宽高/边框 */
  display: block;
  /* Grid 布局下自动占满网格单元，无需手动设 25% */
  width: 100%;
  height: 100%;
  /* 边框盒模型，避免边框超出25%尺寸 */
  box-sizing: border-box;
  border: 1px solid rgba(80, 77, 77, 0.78);
  background-color: #1E2329;
  box-shadow: inset 0 0 8px rgba(100, 149, 237, 0.3);
}

</style>