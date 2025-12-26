<template>
  <div :class="{'container':true,'showBox':isShowBox}">
    <div
        :class="{'drag-area':true}"
        @mousedown="handleDragStart"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
        :style="{  opacity: globalConfig.titleBarOpacity }"
    >
      <div class="title" :style="{ color: globalConfig.windowBgColor }">
        {{ globalConfig.windowTitle }}
        <span style="cursor:pointer;" @click="isShowBox = !isShowBox">
          <img style="height: 8%;width: 8%" v-if="isShowBox" src="/static/显示.png" />
          <img style="height: 8%;width: 8%" v-else src="/static/隐藏.png" />
        </span>
      </div>
    </div>
    <!-- 礼物展示区域（使用全局配置的背景色） -->
    <div class="child-window" >
      <Transition name="gift-anime">
        <div v-if="isPlaying" class="animeBox">
          <!-- 根据匹配后的媒体类型展示GIF/视频 -->
          <template v-if="currentMedia.type === 'gif'">
            <img
                style="height: 60vh; width: 60vw; object-fit: contain;"
                :src="getMediaUrl(currentMedia.path)"
                alt="礼物媒体"
            />
          </template>
          <template v-else>
            <video
                style="height: 60vh; width: 60vw; object-fit: contain;"
                autoplay
                loop
                :src="getMediaUrl(currentMedia.path)"
                alt="礼物视频"
            >
            </video>
          </template>
          <!-- 送礼人信息 -->
          <span v-if="globalConfig.isUserInfo" class="unserinfo" :style="{color:globalConfig.userInfoColor}">
            <img
                style="height: 10vh; width: 10vw; border-radius: 50%; margin-right: 10px;"
                :src="avatar_img"
                alt="用户头像"
            />
            {{ user_name }}
          </span>
        </div>
      </Transition>
    </div>
  </div>
</template>


<script setup lang="ts">
import {onMounted, onUnmounted, reactive, ref} from "vue";
import {ElMessage} from "element-plus";

const windowKey = 'window5'

// 1. 定义配置类型（与主配置页面保持一致）
interface GlobalConfig {
  mediaType: 'gif' | 'mp4';
  mediaPath: string;
  volume: number;
  rate: number;
  pitch: number;
  delay: number;
  defaultTemplate: string;
  windowTitle: string;
  titleBarOpacity: number;
  windowBgColor: string;
  isBuffed:boolean;
  isUserInfo:boolean;
  userInfoColor:string;
}

interface ExclusiveGiftConfig {
  mediaType: 'gif' | 'mp4';
  mediaPath: string;
  exclusiveTemplate: string;
}

// 2. 初始化全局配置（默认兜底值，与主页面一致）
const globalConfig = reactive<GlobalConfig>({
  mediaType: 'gif',
  mediaPath: '',
  volume: 1,
  rate: 1,
  pitch: 1,
  delay: 1500,
  defaultTemplate: '感谢{{uname}}赠送了{{num}}个{{gift_name}}，谢谢支持！',
  windowTitle: '主播的感谢',
  titleBarOpacity: 0,
  windowBgColor: 'rgba(0, 0, 0, 1)',
  userInfoColor: 'rgba(255, 255, 255, 1)',
  isBuffed:false,
  isUserInfo:true,
});
// 3. 初始化专属礼物配置（仅存储定制礼物）
const exclusiveGiftConfig = reactive<Record<string, ExclusiveGiftConfig>>({});

// 4. 当前匹配到的媒体配置（用于模板渲染）
const currentMedia = reactive({
  type: 'gif' as 'gif' | 'mp4',
  path: ''
});

// 5. 媒体路径格式化（区分本地路径和项目内置路径）
const getMediaUrl = (path: string) => {
  // 项目内置默认媒体
  const defaultMediaPath = '/default-gift.gif';
  if (!path) return defaultMediaPath;
  // 本地绝对路径添加file://前缀
  if (path.includes(':\\') || path.startsWith('/')) {
    return `file://${path}`;
  }
  // 项目内静态资源路径
  return path;
};

// 6. 模板替换工具函数
const renderTemplate = (template: string, data: { uname: string; num: number; gift_name: string }) => {
  return template
      .replace(/{{uname}}/g, data.uname)
      .replace(/{{num}}/g, data.num.toString())
      .replace(/{{gift_name}}/g, data.gift_name);
};
let isShowBox = ref(false)
let isDragging = ref(false) // 是否正在拖动
let giftImg = ref('');
let user_name = ref('')
let avatar_img = ref('')
// 1. 初始化语音合成实例（全局唯一）
const speechInstance = window.speechSynthesis
// 预加载语音合成器（避免首次播报延迟）
speechInstance.onvoiceschanged = () => {
  console.log('语音合成器已加载，支持的语音列表：', speechInstance.getVoices().map(v => v.name))
}

let removeExclusiveListener: void | (() => void) | null = null;
const isPlaying = ref(false)
interface GiftItem {
  uname: string; // 用户名
  num: number; // 礼物数量
  gift_name: string; // 礼物名称
  gift_img: string; // 礼物图片地址
  avatar: string; // 用户头像地址
  gift_num?: string; // 可选属性：礼物数量字符串（按需保留）
  createTime: number; // 新增：礼物加入队列的时间戳（毫秒）
}
const giftQueue = ref<GiftItem[]>([])


const pushQueue = (gift: any) => {
  // 去重：1秒内同一用户的同一礼物不重复加入队列
  if(globalConfig.isBuffed){
    const isDuplicate = giftQueue.value.some(item =>
        item.uname === gift.uname &&
        item.gift_name === gift.gift_name &&
        Date.now() - item.createTime < 1000
    );
    if (isDuplicate) return;
  }
  const giftWithTime: GiftItem = {
    ...gift, // 解构原有礼物属性
    createTime: Date.now() // 添加当前时间戳
  };

  giftQueue.value.push(giftWithTime);

  if (isPlaying.value) {
    return
  } else {
    playGiftVoice()
  }
}


// 2. 封装语音播报函数
const playGiftVoice = () => {
  if (giftQueue.value.length === 0) {
    isPlaying.value = false
    return
  }
  // 标记为正在播报
  isPlaying.value = true
  // 取出队列第一个礼物
  const currentGift = giftQueue.value.shift()!

  // 匹配当前礼物的配置
  const giftExclusive = exclusiveGiftConfig[currentGift.gift_name];
  const isHasExclusive = !!giftExclusive;

  // 赋值当前媒体配置（专属 → 全局）
  // 赋值当前媒体配置（专属媒体优先 → 专属无媒体则用全局默认）
  if (isHasExclusive) {
    // 判断专属配置是否有有效媒体路径（非空/非空白字符串）
    const hasExclusiveMedia = giftExclusive.mediaPath && giftExclusive.mediaPath.trim() !== '';
    currentMedia.type = hasExclusiveMedia ? giftExclusive.mediaType : globalConfig.mediaType;
    currentMedia.path = hasExclusiveMedia ? giftExclusive.mediaPath : globalConfig.mediaPath;
  } else {
    // 无专属配置，直接使用全局默认媒体
    currentMedia.type = globalConfig.mediaType;
    currentMedia.path = globalConfig.mediaPath;
  }

  giftImg.value = currentGift.gift_img
  user_name.value = currentGift.uname
  avatar_img.value = currentGift.avatar

  // 获取播报模板（专属 → 全局默认）
  const targetTemplate = isHasExclusive
      ? giftExclusive.exclusiveTemplate
      : globalConfig.defaultTemplate;
  const voiceText = renderTemplate(targetTemplate, {
    uname: currentGift.uname,
    num: currentGift.num,
    gift_name: currentGift.gift_name
  });

  // 创建语音实例
  const utterance = new SpeechSynthesisUtterance(voiceText)

  // 自定义配置
  utterance.lang = 'zh-CN' // 语言（中文）
  utterance.volume = globalConfig.volume;//音量
  utterance.rate = globalConfig.rate;//语速
  utterance.pitch = globalConfig.pitch;//语调

  // 可选：指定语音（比如选择女性语音）
  const voices = speechInstance.getVoices()
  const chineseVoice = voices.find(v => v.lang === 'zh-CN' && v.name.includes('女'))
  if (chineseVoice) utterance.voice = chineseVoice

  // 播报完成回调
  utterance.onend = () => {
    setTimeout(() => {
      isPlaying.value = false
      if (giftQueue.value.length > 0) {
        playGiftVoice()
      }
    }, 1000)
    console.log('礼物播报完成：', globalConfig.delay)
  }
  // 播报错误回调
  utterance.onerror = (err) => {
    setTimeout(() => {
      if (giftQueue.value.length > 0) {
        playGiftVoice()
      }
    }, 500)
    console.error('语音播报失败：', err)
  }

  // 开始播报
  try {
    speechInstance.speak(utterance)
  } catch (e) {
    console.error('播报执行失败：', e)
    isPlaying.value = false
  }
}

// 初始化语音合成器
const initSpeechSynthesis = () => {
  if (speechInstance.getVoices().length === 0) {
    speechInstance.onvoiceschanged = () => {
      console.log('语音合成器已加载');
    };
    setTimeout(() => {
      const emptyEvent = new Event('voiceschanged');
      speechInstance.onvoiceschanged?.call(speechInstance, emptyEvent);
    }, 500);
  }
};

// 8. 监听localStorage变化，同步配置（主页面修改配置后实时更新）
const listenLocalStorageChange = async () => {
  // 初始加载配置
  const loadConfig = async () => {
    const savedConfig = await window.electronAPI.getModuleConfig('giftBroadcast');
    if (savedConfig) {
      try {
        Object.assign(globalConfig, savedConfig.global);
        Object.assign(exclusiveGiftConfig, savedConfig.exclusiveGift);
        ElMessage.success('配置加载成功！');
      } catch (e) {
        ElMessage.error('配置解析失败，将使用默认配置！');
        console.error('配置解析错误：', e);
      }
    }
  };

  // 页面初始化时加载一次
  loadConfig();
};

const handleDragStart = (e: MouseEvent) => {
  isDragging.value = true
  // 发送初始鼠标坐标（屏幕坐标，而非窗口内坐标）
  window.electronAPI.startDrag(windowKey, e.screenX, e.screenY)

  // 先移除已有监听，再添加
  document.removeEventListener('mousemove', handleDragging);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('mouseleave', handleDragEnd);
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

const handleData = (data: {
  uname: string;
  num: number;
  gift_name: string;
  gift_img: string;
  avatar_url: string;
}) => {
  // 构造不含createTime的礼物对象（符合Omit<GiftItem, 'createTime'>类型）
  const giftToPush = {
    uname: data.uname,
    num: data.num,
    gift_name: data.gift_name,
    gift_img: data.gift_img,
    avatar: data.avatar_url,
    gift_num: String(data.num) // 可选属性按需赋值
  };
  console.log(giftToPush)
  pushQueue(giftToPush);
};

onMounted(() => {
  initSpeechSynthesis();
  listenLocalStorageChange(); // 加载并监听配置
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
    removeExclusiveListener()
  }
  // 清理播报资源
  giftQueue.value = []
  window.speechSynthesis.cancel()
  isPlaying.value = false
  console.log(`${windowKey} 已移除专属消息监听`)

})
</script>

<style scoped>
.unserinfo{
  text-align: left;
  color: white;
  font-size: 1.5rem;
  margin-top: 10px;
}
.showBox {
  background-color: #21e80d;
}
/* 过渡动画样式 */
.gift-anime-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.gift-anime-enter-to {
  opacity: 1;
  transform: scale(1);
}
.gift-anime-leave-from {
  opacity: 1;
  transform: scale(1);
}
.gift-anime-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.gift-anime-enter-active,
.gift-anime-leave-active {
  transition: all 0.3s ease;
}
.container{
  width: 100vw;
  height: 100vh;
}
.child-window {
  width: 100%;
  height: calc(100% - 30px);
  box-sizing: border-box;
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

.animeBox {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.5rem;
  font-weight: bolder;
  text-align: left;
}
</style>