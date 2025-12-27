<!-- src/views/ChildWindow1.vue -->
<template>
  <div class="child-window">
    <div
        class="drag-area"
        @mousedown="handleDragStart"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
    >
      <span class="title">猩🐒的礼物
        <span style="cursor:pointer;" @click="isMuted = !isMuted">
          <span v-if="isMuted"><img style="width: 20px;" src="/static/隐藏.png" /></span>
          <span v-else><img style="width: 20px;" src="/static/显示.png" /></span>
        </span>
        <span v-if="isMuted" style="cursor:pointer;margin-left: 30px;color: gold" >{{totalCoin/1000}}元</span>
      </span>
    </div>
    <div class="content">
      <div class="gift-item" v-for="(gift,name) in giftList" :key="name">
        <span style="font-weight: bolder;font-size: 1.5rem">{{gift.name}}</span>
        <img :src="gift.img" style="height: 20px" :alt="gift.name"/>
        <span style="line-height: 20px;font-weight: bolder;color: white;font-size: 1.3rem">*{{gift.num}}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import {computed, onMounted, onUnmounted, reactive, ref} from "vue";
const windowKey = 'window2'

let isDragging = ref(false) // 是否正在拖动
let isMuted = ref(false)

let removeExclusiveListener: void | (() => void) | null = null;

// 1. 开始拖动（鼠标按下）
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
//礼物清单
type gift = { num: number; img: string;price:number;name:string };
let giftMap = reactive(new Map<string, gift>());
let totalCoin = ref(0)

const giftList = computed(() => {
  // Map.entries() 转为 [name, gift] 数组，模板中可解构
  return Object.fromEntries(giftMap.entries());
});

const handleData = (data:any) =>{
  if (data && data._type === 'reload-config') {
    console.log('收到配置更新指令，正在执行...');
    listenLocalStorageChange();
    return;
  }
  if (giftMap.has(data.gift_name)) {
    const current = giftMap.get(data.gift_name);
    if (!current){return}
    current.num = data.num+current.num
    current.price = data.total_coin+current.price
    giftMap.set(data.gift_name, current)
  }else{
    giftMap.set(data.gift_name,{num:data.num,img:data.gift_img,price:data.total_coin,name:data.gift_name})
  }
  totalCoin.value = data.total_coin+totalCoin.value
}

onMounted(()=>{

  removeExclusiveListener = window.electronAPI.onExclusiveChildData(windowKey, handleData)
  console.log(`${windowKey} 已注册专属消息监听`)
})
// 组件卸载清理监听
onUnmounted(() => {
  // 拖动监听清理
  document.removeEventListener('mousemove', handleDragging)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('mouseleave', handleDragEnd)
  // 移除专属监听，防止内存泄漏
  if (removeExclusiveListener) {
    removeExclusiveListener();
    removeExclusiveListener = null; // 重置为 null，保持类型一致
  }
  // 清理播报资源
  window.speechSynthesis.cancel()
  console.log(`${windowKey} 已移除专属消息监听`)
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
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

}
.gift-item{
  width: 80px;
  padding: 10px;
  text-align: left;
}
.title {
  font-size: 1.5rem;
  color: #000000;
  font-weight: bolder;
}
</style>