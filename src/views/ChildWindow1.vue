<!-- ChildWindow1.vue -->
<template>
  <div class="child-window" >
    <!-- 自定义标题栏（拖动区） -->
    <div
        class="drag-area"
        @mousedown="handleDragStart"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
    >
      <span class="title">猩🐒的舰队
        <span style="cursor:pointer;" @click="isMuted = !isMuted">
          <span v-if="isMuted">🔕</span>
          <span v-else>🎵</span>
        </span>
        <span style="cursor:pointer;" @click="addQueue({id:'Ycc_Work',type:'舰长*1'})">🚀🚀🚀</span>
      </span>
    </div>
    <!-- 内容区 -->
    <div class="content">
      <video
          v-show="isPlaying"
          id="videoPlayer"
          ref="videoRef"
          class="welcome-video"
          preload="auto"
          playsinline
          @ended="handleVideoEnd"
      >
      </video>
      <div class="typeContent" v-show="isPlaying">
        <span style="font-size: 2.5rem;font-weight: bolder;color: black;">{{ typingMsg }}</span>
        <span style="display: flex;flex-direction: row;justify-content: space-between;flex:1;margin-top: 10%">
          <img v-show="rulieIndex>=1" style="width: 50%;height: 50%" src="/static/入.png" />
          <img v-show="rulieIndex>=2" style="width: 50%;height: 50%" src="/static/列.png" />
        </span>
      </div>
      <div class="shipList" >
        <div v-for="(item,index) in shipList" :key="index">
          <span style="font-weight: bolder;font-size: 1.5rem">{{item.id}}</span>
          购买了<span style="font-size: 1.5rem">{{item.type}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
const windowKey = 'window1'
let isDragging = ref(false) // 是否正在拖动


let isMuted = ref(true)
const videoRef = ref<HTMLVideoElement | null>(
    document.getElementById("videoPlayer") as HTMLVideoElement | null
);

// 1. 上舰请求队列（存储待播放的用户信息）
const welcomeQueue = ref<{ id: string; type: string }[]>([])
const shipList = ref<{ id: string; type: string}[]>([])
// 2. 播放状态（是否正在播放动画，防止并发）
const isPlaying = ref(false)
// 3. 打字机相关
const typingId = ref('')
const typingMsg = ref('')
let rulieIndex = ref(0)
const videoPool = ref<string[]>([
  '/static/ship_chun.mp4', // 素材1
  '/static/ship_jing.mp4', // 素材2
  '/static/ship2.mp4'  // 素材3
])
const typeSpeed = 100 // 打字速度（ms/字符）
const blessSpeed = 1000
// ========== 工具函数：随机获取一个视频素材（核心） ==========
const getRandomVideo = () => {
  const randomIndex = Math.floor(Math.random() * videoPool.value.length)
  return videoPool.value[randomIndex]
}
const playing = () => {
  if (welcomeQueue.value.length <= 0) {
    isPlaying.value = false
    return
  }
  if (!videoRef.value) return;
  isPlaying.value = true;
  const currentUser = welcomeQueue.value.shift();
  // 清空原有事件
  videoRef.value.onloadeddata = null
  videoRef.value.onerror = null
  const targetVideo = getRandomVideo()
  // 重置视频状态
  videoRef.value.pause()
  videoRef.value.currentTime = 0
  videoRef.value.src = ''
  videoRef.value.load()
  // 设置新视频源
  videoRef.value.src = targetVideo
  videoRef.value.load()
  // 加载完成播放
  videoRef.value.onloadeddata = () => {
    videoRef.value!.muted = isMuted.value
    videoRef.value!.currentTime = 0
    videoRef.value!.play().catch(err => {
      console.error('播放失败：', err)
    })
  }
  if (currentUser) {
    startTyping(currentUser);
  }
}

const startTyping = (user:{id:string,type:string}) => {
  // 清空原有内容
  user.id = user.id+'号'
  typingId.value = ''
  typingMsg.value = ''
  rulieIndex.value = 0
  // 先渲染ID
  let idIndex = 0
  const idTimer = setInterval(() => {
    if (idIndex>=user.id.length){
      clearInterval(idTimer)
      return
    }
    typingMsg.value += user.id[idIndex]
    idIndex++
  }, typeSpeed)
  const rulieTimer = setInterval(()=>{
    if (rulieIndex.value>2){
      clearInterval(rulieTimer)
      return
    }
    rulieIndex.value++;
  },blessSpeed)
}

const addQueue = (user:{id:string,type:string}) =>{
  welcomeQueue.value.push(user);
  shipList.value.push(user)
  if (isPlaying.value){
    return
  }else{
   playing()
  }
}


const handleVideoEnd = () => {
  isPlaying.value = false
  setTimeout(() => {
    if (welcomeQueue.value.length > 0) {
      playing()
    }
  }, 1000)
}



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

const handleData = (data:any) => {
  console.log(data)
}


onMounted(()=>{
  window.electronAPI.onExclusiveChildData(windowKey, handleData)
})

// 组件卸载清理监听
onUnmounted(() => {
  // 拖动监听清理
  document.removeEventListener('mousemove', handleDragging)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('mouseleave', handleDragEnd)

})
</script>

<style scoped>
.shipList{
  z-index: 5;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  div{
    flex: 1;
    box-sizing: border-box;
    text-align: left;
    span{
      color: black;
    }
  }
}

.welcome-video {
  z-index: 15;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  object-fit: cover;
  pointer-events: none;
  outline: none;
  border: none;
}

.typeContent{
  z-index: 25;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 5%;
  display: flex;
  flex-direction: column;
}

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

.title {
  font-size: 1.5rem;
  color: #000000;
  font-weight: bolder;
}


.content {
  height: calc(100% - 50px);
  width: 100%;
  box-sizing: border-box;
  position:relative;
}
/* 子窗口样式中添加：自定义细滚动条 */
/* 全局滚动条样式（适配Electron） */
:global(::-webkit-scrollbar) {
  width: 2px; /* 垂直滚动条宽度（极细） */
  height: 2px; /* 水平滚动条高度（极细） */
}

/* 滚动条轨道（背景） */
:global(::-webkit-scrollbar-track) {
  background: transparent; /* 透明轨道，融入窗口背景 */
  border-radius: 1px;
}

/* 滚动条滑块（拖动条） */
:global(::-webkit-scrollbar-thumb) {
  background: rgba(77, 255, 64, 0.2); /* 淡蓝色半透明，不易察觉 */
  border-radius: 1px; /* 圆角，更细腻 */
}

/* 滑块hover时稍微变明显（可选） */
:global(::-webkit-scrollbar-thumb:hover) {
  background: rgba(77, 255, 64, 0.3);
}

/* Firefox适配 */
:global(body),
:global(html),
.child-window,
.content {
  scrollbar-width: thin; /* 细滚动条 */
  scrollbar-color: rgba(77, 255, 64, 0.3) transparent; /* 滑块颜色 + 轨道透明 */
}


</style>