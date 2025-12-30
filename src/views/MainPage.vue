<!-- src/views/MainPage.vue -->
<template>
  <div class="main-container">
    <div class="bgVideo">
      <video src="/static/bgVideo.mp4"  autoplay loop ></video>
    </div>
    <div class="content">
      <h1>🐒的互动</h1>
      <div>
        <button class="btn open-btn" v-if="isConnecting == false" @click="openWebsocket">开启链接</button>
        <button class="btn config-btn" @click="openConfig(null)">配置页面</button>
        <button class="btn close-all-btn"  v-if="isConnecting == true" @click="closeAllChildWindows">
          关闭所有子窗口
        </button>
      </div>
      <div class="btnBox" v-if="isConnecting == true">
        <div class="window-group">
          <h2>上舰动画页面</h2>
          <div>
            <button class="btn open-btn"  @click="openChildWindow('window1')">打开</button>
            <button class="btn close-btn"  @click="closeChildWindow('window1')">关闭</button>
            <button class="btn config-btn" @click="openConfig('shipLoad')">配置页面</button>
          </div>
        </div>

        <!-- 子窗口2控制按钮 -->
        <div class="window-group">
          <h2>礼物统计页面</h2>
          <div>
            <button class="btn open-btn"  @click="openChildWindow('window2')">打开</button>
            <button class="btn close-btn"   @click="closeChildWindow('window2')">关闭</button>
            <button class="btn config-btn" @click="openConfig('giftStatistics')">配置页面</button>
          </div>
        </div>

        <!-- 子窗口3控制按钮 -->
        <div class="window-group">
          <h2>特殊弹幕页面</h2>
          <div>
            <button class="btn open-btn" disabled @click="openChildWindow('window3')">打开</button>
            <button class="btn close-btn" disabled @click="closeChildWindow('window3')">关闭</button>
            <button class="btn config-btn" @click="openConfig('specialDanmaku')">配置页面</button>
          </div>
        </div>

        <div class="window-group">
          <h2>礼物抽奖页面</h2>
          <div>
            <button class="btn open-btn" disabled @click="openChildWindow('window4')">打开</button>
            <button class="btn close-btn" disabled @click="closeChildWindow('window4')">关闭</button>
            <button class="btn config-btn" @click="openConfig('giftLottery')">配置页面</button>
          </div>
        </div>

        <div class="window-group">
          <h2>礼物播报页面</h2>
          <div>
            <button class="btn open-btn" @click="openChildWindow('window5')">打开</button>
            <button class="btn close-btn" @click="closeChildWindow('window5')">关闭</button>
            <button class="btn config-btn" @click="openConfig('giftBroadcast')">配置页面</button>
          </div>
        </div>
        <div class="window-group">
          <h2>弹幕投票页面</h2>
          <div>
            <button class="btn open-btn" @click="openChildWindow('window6')">打开</button>
            <button class="btn close-btn" @click="closeChildWindow('window6')">关闭</button>
            <button class="btn config-btn" @click="openConfig('danmukuVote')">配置页面</button>
          </div>
        </div>
      </div>
    </div>
    <el-drawer v-model="drawer" :show-close="true" size="100%" :direction="direction" resizable>
      <el-tabs type="border-card" class="tabs" lazy v-model="activeTabName">
        <el-tab-pane label="上舰动画设置" name="shipLoad">
          <ShipLoadConfig v-if="activeTabName === 'shipLoad'"></ShipLoadConfig>
        </el-tab-pane>
        <el-tab-pane label="礼物统计设置" name="giftStatistics">
          <GiftStatisticsConfig v-if="activeTabName === 'giftStatistics'"></GiftStatisticsConfig>
        </el-tab-pane>
        <el-tab-pane label="特殊弹幕设置" name="specialDanmaku">
          <SpecialDanmKuConfig v-if="activeTabName === 'specialDanmaku'"></SpecialDanmKuConfig>
        </el-tab-pane>
        <el-tab-pane label="礼物抽奖设置" name="giftLottery">
          <GiftLotteryConfig v-if="activeTabName === 'giftLottery'"></GiftLotteryConfig>
        </el-tab-pane>
        <el-tab-pane label="礼物播报设置" name="giftBroadcast">
          <GiftBroadcastConfig v-if="activeTabName === 'giftBroadcast'"> </GiftBroadcastConfig>
        </el-tab-pane>
        <el-tab-pane label="弹幕投票设置" name="danmukuVote">
        </el-tab-pane>
      </el-tabs>

    </el-drawer>

  </div>
</template>

<script setup lang="ts">
// 打开指定子窗口
import {onUnmounted, ref} from "vue";
import  GiftBroadcastConfig from "../components/GiftBroadcastConfig.vue";
import GiftLotteryConfig from "../components/GiftLotteryConfig.vue";
import GiftStatisticsConfig from "../components/GiftStatisticsConfig.vue";
import ShipLoadConfig from "../components/ShipLoadConfig.vue";
import SpecialDanmKuConfig from "../components/SpecialDanmKuConfig.vue";
const activeTabName = ref('shipLoad');
let isConnecting = ref(false)
const drawer = ref(false)
const direction = ref('btt')
const openChildWindow = async (windowKey: string) => {
  try {
    await window.electronAPI.openChildWindow(windowKey)
    console.log(`子窗口${windowKey}已打开`)
  } catch (error) {
    console.error(`打开子窗口${windowKey}失败：`, error)
  }
}

const openConfig = (name:any)=>{
  if (name){
    activeTabName.value = name;
  }else{
    activeTabName.value = 'shipLoad'
  }
  drawer.value = !drawer.value
}

// 关闭指定子窗口
const closeChildWindow = async (windowKey: string) => {
  try {
    await window.electronAPI.closeChildWindow(windowKey)
    console.log(`子窗口${windowKey}已关闭`)
  } catch (error) {
    console.error(`关闭子窗口${windowKey}失败：`, error)
  }
}

// 关闭所有子窗口
const closeAllChildWindows = async () => {
  try {
    await window.electronAPI.closeAllChildWindows()
    console.log('所有子窗口已关闭')
  } catch (error) {
    console.error('关闭所有子窗口失败：', error)
  }
}

const openWebsocket = ()=>{
  window.electronAPI.connectLiveServer((data:any) => {
    switch (data.type) {
      case 'connect_confirm':
        if (data.status == 'success'){
          isConnecting.value = true
        }
        break;
      case 'gift':
        window.electronAPI.sendDataToChild('window2', data)
        window.electronAPI.sendDataToChild('window5', data)
        break
      case 'buy_guard':
        window.electronAPI.sendDataToChild('window1', data)
        break
      default:
        break
    }
  })
}



// 页面卸载时关闭连接
onUnmounted(() => {
  window.electronAPI.disconnectLiveServer?.();
  isConnecting.value = false;
})



</script>

<style scoped>
.btnBox{
  display: flex;
  flex-wrap: wrap; /* 核心：自动换行 */
  gap: 1rem; /* 使用 rem 作为间距单位 */
  padding: 1.5rem;
  width: 100%; /* 宽度占满父容器 */
  box-sizing: border-box; /* 确保 padding 不会撑大宽度 */
}
:deep(.el-drawer__header){
  margin: 0;
  padding: 0;
}
:deep(.el-drawer__body){
  padding: 0;
}
.tabs{
  height: 100%;
  width: 100%;
}
.main-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #DEDCDA;
  overflow: hidden;
}

.content{
  flex: 1;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.bgVideo{
  z-index: 0;
  position: absolute;
  bottom: 0;
  left: 0;
  video{
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    opacity:0.5;
    z-index: 0
  }
}
.window-group {
  /* 核心：使用 flex-basis 和 fr 单位 */
  /* 这会让每个 item 占据 1/3 的可用空间，同时 flex-grow: 1 确保它们能拉伸填满 */
  flex: 1 1 calc(33.333% - 1rem);
  /* 更现代、更简洁的方式 (推荐) */
  /* flex: 1 1 0;
     flex-basis: 1fr; */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 让文字和按钮组分开 */
  gap: 0.5rem; /* 小组内部元素的间距 */
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background-color: rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  transition: box-shadow 0.2s;
}
.window-group:hover{
  box-shadow:  19px 19px 39px #817d7d,
  -19px -19px 39px #434343;
}
.btn {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  margin: 0 5px;
  z-index: 5;
}

.open-btn {
  background-color: #409eff;
  color: white;
}
.config-btn {
  background-color: #f8692c;
  color: white;
}

.close-btn {
  background-color: #f56c6c;
  color: white;
}

.close-all-btn {
  background-color: #e6a23c;
  color: white;
  padding: 10px 20px;
}
h2{
  color: black;
}
.btn:hover {
  opacity: 0.9;
}
</style>