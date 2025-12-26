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
    <div class="child-window " >
      <Transition name="gift-anime">
        <div v-if="isPlaying" class="animeBox">
          <!-- 根据匹配后的媒体类型展示GIF/视频 -->
          <template v-if="currentMedia.type === 'gif'">
            <img
                ref="mediaElementRef"
                style="height: 90vh; width: 90vw; object-fit: cover;"
                :src="getMediaUrl(currentMedia.path)"
                alt="礼物媒体"
                @load="onMediaLoad"
            />
          </template>
          <template v-else>
            <video
                ref="mediaElementRef"
                style="height: 90vh; width: 90vw; object-fit: cover;"
                autoplay
                :loop="globalConfig.isLoop"
                :src="getMediaUrl(currentMedia.path)"
                alt="礼物视频"
                @loadedmetadata="onMediaLoad"
                @ended="onMediaEnded"
            >
            </video>
          </template>
          <!-- 音频播放（独立音频） -->
          <audio
              ref="audioElementRef"
              v-if="currentAudio.path"
              :src="getMediaUrl(currentAudio.path)"
              :volume="currentAudio.volume"
              autoplay
              :loop="false"
              @loadedmetadata="onAudioLoad"
              @ended="onAudioEnded"
          />
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
import { onMounted, onUnmounted, reactive, ref, nextTick  } from "vue";
import { ElMessage } from "element-plus";

const windowKey = 'window5'

// 1. 扩展配置类型（新增音频相关字段）
interface GlobalConfig {
  mediaType: 'gif' | 'mp4';
  mediaPath: string;
  audioPath: string; // 新增：全局音频路径
  audioVolume: number; // 新增：全局音频音量
  delay: number;
  windowTitle: string;
  titleBarOpacity: number;
  windowBgColor: string;
  isBuffed: boolean;
  isUserInfo: boolean;
  userInfoColor: string;
  mediaWidth: number;
  mediaHeight: number;
  isLoop: boolean;
  isKeepFit: boolean;
}

interface ExclusiveGiftConfig {
  mediaType: 'gif' | 'mp4';
  mediaPath: string;
  audioPath: string; // 新增：专属音频路径
}

// 2. 初始化全局配置（新增音频字段）
const globalConfig = reactive<GlobalConfig>({
  mediaType: 'gif',
  mediaPath: '',
  audioPath: '',
  audioVolume: 1,
  delay: 1500,
  mediaWidth:60,
  mediaHeight:60,
  isBuffed:false,
  isUserInfo:true,
  isKeepFit:false,
  isLoop:true,
  windowTitle: '主播的感谢',
  titleBarOpacity: 1,
  windowBgColor: 'rgba(0, 0, 0, 1)',
  userInfoColor: 'rgba(0, 0, 0, 1)'
});

const exclusiveGiftConfig = reactive<Record<string, ExclusiveGiftConfig>>({});

// 4. 当前匹配到的媒体/音频配置
const currentMedia = reactive({
  type: 'gif' as 'gif' | 'mp4',
  path: '',
  duration: 0 // 媒体时长（秒）
});
const currentAudio = reactive({
  path: '',
  volume: 1,
  duration: 0 // 音频时长（秒）
});

// 5. 媒体/音频元素引用（用于获取时长、控制播放）
const mediaElementRef = ref<HTMLImageElement | HTMLVideoElement | null>(null);
const audioElementRef = ref<HTMLAudioElement | null>(null);

// 6. 播放状态管理
const isPlaying = ref(false);
const mediaEnded = ref(false); // 媒体是否播放结束
const audioEnded = ref(false); // 音频是否播放结束
const playTimer = ref<NodeJS.Timeout | null>(null); // 播放时长定时器
const isProcessingQueue = ref(false); // 新增：防止队列并发处理

// 7. 媒体路径格式化
const getMediaUrl = (path: string) => {
  const defaultMediaPath = '/static/ship_chun.mp4';
  if (!path) return defaultMediaPath;
  if (path.includes(':\\') || path.startsWith('/')) {
    return `file://${path}`;
  }
  return path;
};

// 8. 礼物队列相关
let isShowBox = ref(false);
let isDragging = ref(false);
let giftImg = ref('');
let user_name = ref('');
let avatar_img = ref('');

interface GiftItem {
  uname: string;
  num: number;
  gift_name: string;
  gift_img: string;
  avatar: string;
  gift_num?: string;
  createTime: number;
}
const giftQueue = ref<GiftItem[]>([]);

// 9. 推入礼物队列（移除语音相关）
const pushQueue = (gift: any) => {
  // 去重逻辑保留
  if (globalConfig.isBuffed) {
    const isDuplicate = giftQueue.value.some(item =>
        item.uname === gift.uname &&
        item.gift_name === gift.gift_name &&
        Date.now() - item.createTime < 1000
    );
    if (isDuplicate) return;
  }

  const giftWithTime: GiftItem = {
    ...gift,
    createTime: Date.now()
  };

  giftQueue.value.push(giftWithTime);
  // 只有当未处理队列时，才启动播放
  if (!isPlaying.value && !isProcessingQueue.value) {
    playGiftMedia();
  }
};
let index = 0
const playGiftMedia = async () => {
  // 标记为正在处理队列
  isProcessingQueue.value = true;
  index++;
  if (giftQueue.value.length === 0) {
    isPlaying.value = false;
    mediaEnded.value = false;
    audioEnded.value = false;
    isProcessingQueue.value = false;
    return;
  }

  // 第一步：强制重置所有播放资源（关键！）
  resetAllMediaAndAudio();

  // 第二步：重置状态
  isPlaying.value = true;
  mediaEnded.value = false;
  audioEnded.value = false;
  currentMedia.duration = 0;
  currentAudio.duration = 0;
  if (playTimer.value) {
    clearTimeout(playTimer.value);
    playTimer.value = null;
  }

  // 第三步：取出当前礼物
  const currentGift = giftQueue.value.shift()!;
  const giftExclusive = exclusiveGiftConfig[currentGift.gift_name];
  const isHasExclusive = !!giftExclusive;
  console.log(index+"->"+currentGift.gift_name+ new Date())
  // 第四步：赋值配置
  if (isHasExclusive) {
    const hasExclusiveMedia = giftExclusive.mediaPath && giftExclusive.mediaPath.trim() !== '';
    currentMedia.type = hasExclusiveMedia ? giftExclusive.mediaType : globalConfig.mediaType;
    currentMedia.path = hasExclusiveMedia ? giftExclusive.mediaPath : globalConfig.mediaPath;
    currentAudio.path = giftExclusive.audioPath;
  } else {
    currentMedia.type = globalConfig.mediaType;
    currentMedia.path = globalConfig.mediaPath;
    currentAudio.path = globalConfig.audioPath;
  }
  currentAudio.volume = globalConfig.audioVolume;

  // 赋值用户信息
  user_name.value = currentGift.uname;
  avatar_img.value = currentGift.avatar;
  giftImg.value = currentGift.gift_img;

  // 第五步：等待DOM更新后，重新加载媒体/音频（关键！）
  await nextTick();
  reloadMediaAndAudio();
};

const resetAllMediaAndAudio = () => {
  // 重置媒体元素
  if (mediaElementRef.value) {
    if (currentMedia.type === 'mp4') {
      const video = mediaElementRef.value as HTMLVideoElement;
      video.pause(); // 暂停
      video.currentTime = 0; // 重置播放位置
      video.src = ''; // 清空src
    } else {
      const img = mediaElementRef.value as HTMLImageElement;
      img.src = ''; // 清空src
    }
    mediaElementRef.value = null; // 清空引用
  }

  // 重置音频元素
  if (audioElementRef.value) {
    const audio = audioElementRef.value;
    audio.pause(); // 暂停
    audio.currentTime = 0; // 重置播放位置
    audio.src = ''; // 清空src
    audioElementRef.value = null; // 清空引用
  }

  // 重置状态
  mediaEnded.value = false;
  audioEnded.value = false;
};

const reloadMediaAndAudio = () => {
  // 加载媒体
  if (currentMedia.path) {
    if (currentMedia.type === 'mp4') {
      const video = mediaElementRef.value as HTMLVideoElement;
      if (video) {
        video.src = getMediaUrl(currentMedia.path);
        video.load(); // 强制重新加载
        video.play().catch(err => console.error('视频播放失败：', err));
      }
    } else {
      const img = mediaElementRef.value as HTMLImageElement;
      if (img) {
        img.src = getMediaUrl(currentMedia.path); // GIF重新加载
      }
    }
  }

  // 加载音频
  if (currentAudio.path) {
    const audio = audioElementRef.value as HTMLAudioElement;
    if (audio) {
      audio.src = getMediaUrl(currentAudio.path);
      audio.volume = currentAudio.volume;
      audio.load(); // 强制重新加载
      audio.play().catch(err => console.error('音频播放失败：', err));
    }
  }
};

const onMediaLoad = () => {
  console.log('视频加载完毕')
  if (mediaElementRef.value) {
    if (currentMedia.type === 'mp4') {
      const video = mediaElementRef.value as HTMLVideoElement;
      currentMedia.duration = video.duration || 0;
    } else {
      currentMedia.duration = globalConfig.delay / 1000;
    }
    checkPlayDuration();
  }
};

// 13. 音频加载完成（不变）
const onAudioLoad = () => {
  console.log('音频加载完毕')
  if (audioElementRef.value) {
    currentAudio.duration = audioElementRef.value.duration || 0;
    checkPlayDuration();
  }
};

const checkPlayDuration = () => {
  if (playTimer.value) {
    clearTimeout(playTimer.value);
    playTimer.value = null;
  }

  const maxDuration = Math.max(currentMedia.duration, currentAudio.duration);
  if (maxDuration > 0) {
    playTimer.value = setTimeout(() => {
      endPlay();
    }, maxDuration * 1000);
  } else {
    playTimer.value = setTimeout(() => {
      endPlay();
    }, globalConfig.delay);
  }
};

// 15. 媒体结束回调（优化）
// const onMediaEnded = () => {
//   mediaEnded.value = true;
//   // 只有音频也结束/无音频时，才结束播放
//   if (audioEnded.value || !currentAudio.path) {
//     endPlay();
//   }
// };
const isEndingPlay = ref(false);
// 16. 音频结束回调（优化）
const onAudioEnded = () => {
  audioEnded.value = true;
  // 加防护：只有媒体也结束/无媒体时，且未在结束流程中，才调用endPlay
  if ((mediaEnded.value || !currentMedia.path) && !isEndingPlay.value) {
    endPlay();
  }
};

const endPlay = () => {
  // 清除定时器
  if (playTimer.value) {
    clearTimeout(playTimer.value);
    console.log('清除定时器')
    playTimer.value = null;
  }

  // 延迟1秒后，处理下一个礼物（保留原有延迟）
  setTimeout(async () => {
    isPlaying.value = false;
    // 标记为未处理队列
    isProcessingQueue.value = false;
    // 递归处理下一个礼物
    console.log('继续播放')
    await playGiftMedia();
  }, 1000);
};

const listenLocalStorageChange = async () => {
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

  loadConfig();
};

const handleDragStart = (e: MouseEvent) => {
  isDragging.value = true;
  window.electronAPI.startDrag(windowKey, e.screenX, e.screenY);

  document.removeEventListener('mousemove', handleDragging);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('mouseleave', handleDragEnd);
  document.addEventListener('mousemove', handleDragging);
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('mouseleave', handleDragEnd);

  e.preventDefault();
};

const handleDragging = (e: MouseEvent) => {
  if (isDragging.value) {
    window.electronAPI.dragging(windowKey, e.screenX, e.screenY);
  }
};

const handleDragEnd = () => {
  if (isDragging.value) {
    isDragging.value = false;
    window.electronAPI.stopDrag(windowKey);
    document.removeEventListener('mousemove', handleDragging);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('mouseleave', handleDragEnd);
  }
};

const handleData = (data: {
  uname: string;
  num: number;
  gift_name: string;
  gift_img: string;
  avatar_url: string;
}) => {
  const giftToPush = {
    uname: data.uname,
    num: data.num,
    gift_name: data.gift_name,
    gift_img: data.gift_img,
    avatar: data.avatar_url,
    gift_num: String(data.num)
  };
  pushQueue(giftToPush);
};

onUnmounted(() => {
  // 拖动监听清理
  document.removeEventListener('mousemove', handleDragging);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('mouseleave', handleDragEnd);

  // 移除消息监听
  if (window.electronAPI.onExclusiveChildData && window.electronAPI.removeListener) {
    window.electronAPI.removeListener(windowKey);
  }

  // 强制重置所有播放资源
  resetAllMediaAndAudio();

  // 清理队列和定时器
  giftQueue.value = [];
  isPlaying.value = false;
  isProcessingQueue.value = false;
  mediaEnded.value = false;
  audioEnded.value = false;
  if (playTimer.value) clearTimeout(playTimer.value);
});

onMounted(() => {
  listenLocalStorageChange(); // 加载配置
  if (window.electronAPI.onExclusiveChildData) {
    window.electronAPI.onExclusiveChildData(windowKey, handleData);
  }
  console.log(`${windowKey} 已注册专属消息监听`);
});
</script>

<style scoped>
.unserinfo {
  position: absolute;
  bottom: 5%;
  left: 5%;
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
.container {
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
  position: relative; /* 新增：用于定位用户信息 */
  width: 100%;
  height: 100%;
}
.title {
  font-size: 1.5rem;
  font-weight: bolder;
  text-align: left;
}
/* 隐藏音频元素（只播放不显示） */
audio {
  display: none;
}
</style>