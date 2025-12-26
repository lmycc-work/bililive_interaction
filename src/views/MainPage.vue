<!-- src/views/MainPage.vue -->
<template>
  <div class="main-container">
    <h1>🐒🐒🐒</h1>
    <button class="btn open-btn" v-if="isConnecting == false" @click="openWebsocket">开启链接</button>
    <button class="btn config-btn" @click="openConfig">配置页面</button>
    <div v-if="isConnecting == true">
    <div class="window-group">
      <h3>上舰动画页面</h3>
      <button class="btn open-btn"  @click="openChildWindow('window1')">打开</button>
      <button class="btn close-btn"  @click="closeChildWindow('window1')">关闭</button>
    </div>

    <!-- 子窗口2控制按钮 -->
    <div class="window-group">
      <h3>礼物统计页面</h3>
      <button class="btn open-btn"  @click="openChildWindow('window2')">打开</button>
      <button class="btn close-btn"   @click="closeChildWindow('window2')">关闭</button>
    </div>

    <!-- 子窗口3控制按钮 -->
    <div class="window-group">
      <h3>特殊弹幕页面</h3>
      <button class="btn open-btn" disabled @click="openChildWindow('window3')">打开</button>
      <button class="btn close-btn" disabled @click="closeChildWindow('window3')">关闭</button>
    </div>

    <div class="window-group">
      <h3>礼物抽奖页面</h3>
      <button class="btn open-btn" disabled @click="openChildWindow('window4')">打开</button>
      <button class="btn close-btn" disabled @click="closeChildWindow('window4')">关闭</button>
    </div>

    <div class="window-group">
      <h3>礼物播报页面</h3>
      <button class="btn open-btn" @click="openChildWindow('window5')">打开</button>
      <button class="btn close-btn" @click="closeChildWindow('window5')">关闭</button>
    </div>
    <!-- 关闭所有子窗口按钮 -->
    <button class="btn close-all-btn" @click="closeAllChildWindows">
      关闭所有子窗口
    </button>
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

const openConfig = ()=>{
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
  text-align: center;
  background: transparent;
}

.window-group {
  margin: 10px 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  margin: 0 5px;
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

.btn:hover {
  opacity: 0.9;
}
</style>