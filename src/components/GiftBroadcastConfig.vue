<template>
  <div class="config-page-container">
    <!-- 配置页面标题 -->
    <div class="page-title">礼物播报配置中心</div>

    <!-- 核心表单：全局默认配置 -->
    <el-card shadow="hover" class="config-form-card">
      <el-form
          :model="globalConfigForm"
          label-width="120px"
          :rules="globalFormRules"
          ref="globalConfigFormRef"
          class="main-config-form"
      >
        <!-- 1. 全局默认媒体配置 -->
        <el-divider content-position="left">全局默认媒体配置（未定制礼物将使用此配置）</el-divider>
        <el-form-item label="媒体播放类型" prop="mediaType">
          <el-select v-model="globalConfigForm.mediaType" placeholder="请选择全局默认媒体类型">
            <el-option label="动态图片（GIF/APNG/WEBP）" value="gif" />
            <el-option label="视频文件（MP4/MOV/WEBM）" value="mp4" />
          </el-select>
        </el-form-item>
        <el-form-item label="本地媒体路径" prop="mediaPath">
          <el-input
              v-model="globalConfigForm.mediaPath"
              readonly
              placeholder="未选择则使用项目内置默认媒体"
          >
            <template #append>
              <el-button
                  type="primary"
                  icon="Upload"
                  @click="selectGlobalMedia"
              >
                选择全局媒体
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="媒体预览">
          <div class="media-preview-box">
            <el-alert
                v-if="!globalConfigForm.mediaPath"
                title="当前使用项目内置默认媒体（/default-gift.gif）"
                type="info"
                :closable="false"
                size="small"
            />
            <template v-else-if="globalConfigForm.mediaType === 'gif'">
              <el-image
                  :src="getMediaUrl(globalConfigForm.mediaPath)"
                  fit="contain"
                  style="width: 200px; height: 200px;"
                  preview-src-list="[getMediaUrl(globalConfigForm.mediaPath)]"
              />
            </template>
            <template v-else>
              <video
                  :src="getMediaUrl(globalConfigForm.mediaPath)"
                  controls
                  style="width: 200px; height: 200px;"
              />
            </template>
          </div>
        </el-form-item>

        <!-- 2. 全局默认播报配置 -->
        <el-divider content-position="left">全局默认播报配置（未定制礼物将使用此配置）</el-divider>
        <el-form-item label="音量（0-1）" prop="volume">
          <el-slider
              v-model="globalConfigForm.volume"
              :min="0"
              :max="1"
              :step="0.1"
              show-input
              show-input-controls
          />
        </el-form-item>
        <el-form-item label="语速（0.1-3）" prop="rate">
          <el-slider
              v-model="globalConfigForm.rate"
              :min="0.1"
              :max="3"
              :step="0.1"
              show-input
              show-input-controls
          />
        </el-form-item>
        <el-form-item label="音调（0-2）" prop="pitch">
          <el-slider
              v-model="globalConfigForm.pitch"
              :min="0"
              :max="2"
              :step="0.1"
              show-input
              show-input-controls
          />
        </el-form-item>
        <el-form-item label="动画延时（ms）" prop="delay">
          <el-slider
              v-model="globalConfigForm.delay"
              :min="500"
              :max="3000"
              :step="100"
              show-input
              show-input-controls
          />
        </el-form-item>
        <el-form-item label="默认播报模板" prop="defaultTemplate">
          <el-input
              v-model="globalConfigForm.defaultTemplate"
              type="textarea"
              :rows="3"
              placeholder="支持变量：{{uname}}=送礼人，{{num}}=礼物数量，{{gift_name}}=礼物名称"
          />
        </el-form-item>
        <el-form-item>
          <el-button
              type="success"
              icon="VolumeUp"
              @click="previewGlobalBroadcast"
          >
            预览全局默认播报效果
          </el-button>
        </el-form-item>

        <!-- 3. 全局窗口样式配置 -->
        <el-divider content-position="left">全局窗口样式配置</el-divider>
        <el-form-item label="子页面标题" prop="windowTitle">
          <el-input v-model="globalConfigForm.windowTitle" placeholder="请输入子页面默认标题" />
        </el-form-item>
        <el-form-item label="标题栏透明度" prop="titleBarOpacity">
          <el-slider
              v-model="globalConfigForm.titleBarOpacity"
              :min="0"
              :max="1"
              :step="0.01"
              show-input
              show-input-controls
              :precision="2"
          />
        </el-form-item>
        <el-form-item label="标题字体颜色" prop="windowBgColor">
          <el-color-picker
              v-model="globalConfigForm.windowBgColor"
              show-alpha
              format="rgba"
          />
          <el-input
              v-model="globalConfigForm.windowBgColor"
              style="margin-left: 10px; width: 200px;"
          />
        </el-form-item>
        <el-form-item label-width="150" label="是否开启礼物去重" prop="isBuffed">
          <el-switch
              v-model="globalConfigForm.isBuffed"
              size="large"
              active-text="开启"
              inactive-text="关闭"
          />
        </el-form-item>
        <el-form-item label-width="150" label="是否展示用户信息" prop="isUserInfo">
          <el-switch
              v-model="globalConfigForm.isUserInfo"
              size="large"
              active-text="开启"
              inactive-text="关闭"
          />
        </el-form-item>
        <el-form-item label="用户信息颜色" prop="userInfoColor">
          <el-color-picker
              v-model="globalConfigForm.userInfoColor"
              show-alpha
              format="rgba"
          />
          <el-input
              v-model="globalConfigForm.userInfoColor"
              style="margin-left: 10px; width: 200px;"
          />
        </el-form-item>
        <!-- 全局配置按钮组 -->
        <el-form-item class="form-btn-group">
          <el-button
              type="default"
              icon="RefreshLeft"
              @click="resetGlobalConfig"
          >
            恢复全局默认配置
          </el-button>
          <el-button
              type="primary"
              icon="Save"
              @click="saveGlobalConfig"
          >
            保存全局配置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 礼物专属配置：仅对需要定制的礼物添加（如小花花、火箭） -->
    <el-card shadow="hover" class="gift-exclusive-card" style="margin-top: 20px;">
      <div class="card-title">礼物专属配置（仅添加需要定制的礼物，其余自动使用全局默认）</div>

      <!-- 新增专属礼物配置表单 -->
      <el-form
          :model="newExclusiveGiftForm"
          label-width="80px"
          inline
          class="add-gift-form"
      >
        <el-form-item label="礼物名称">
          <el-input
              v-model="newExclusiveGiftForm.giftName"
              placeholder="如：小花花、人气票（需与实际礼物名称一致）"
              style="width: 150px;"
          />
        </el-form-item>
        <el-form-item label="媒体类型">
          <el-select
              v-model="newExclusiveGiftForm.mediaType"
              placeholder="选择专属媒体类型"
              style="width: 120px;"
          >
            <el-option label="GIF" value="gif" />
            <el-option label="MP4" value="mp4" />
          </el-select>
        </el-form-item>
        <el-form-item label="专属媒体">
          <el-button
              type="primary"
              icon="Upload"
              @click="selectExclusiveGiftMedia"
              style="width: 120px;"
          >
            选择专属媒体
          </el-button>
        </el-form-item>
        <el-form-item  label="播报模板">
          <el-input
              v-model="newExclusiveGiftForm.exclusiveTemplate"
              placeholder="支持{{uname}}{{num}}{{gift_name}}"
              style="width: 300px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button
              type="success"
              icon="Plus"
              @click="addExclusiveGiftConfig"
          >
            添加专属配置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 专属礼物配置表格 -->
      <el-table
          :data="exclusiveGiftList"
          border
          style="margin-top: 15px;"
          :header-cell-style="{ background: '#f5f7fa' }"
          v-if="Object.keys(exclusiveGiftConfig).length > 0"
      >
        <el-table-column prop="giftName" label="礼物名称" align="center" width="120" />
        <el-table-column prop="mediaType" label="媒体类型" align="center" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.mediaType === 'gif' ? 'info' : 'warning'">
              {{ scope.row.mediaType === 'gif' ? 'GIF' : 'MP4' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mediaPath" label="专属媒体路径" align="center">
          <template #default="scope">
            <el-input
                v-model="scope.row.mediaPath"
                readonly
                size="small"
                style="width: 280px;"
            >
              <template #append>
                <el-button
                    type="text"
                    icon="Refresh"
                    @click="reselectExclusiveGiftMedia(scope.row)"
                />
              </template>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column prop="exclusiveTemplate" label="专属播报模板" align="center">
          <template #default="scope">
            <el-input
                v-model="scope.row.exclusiveTemplate"
                size="small"
                style="width: 280px;"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100">
          <template #default="scope">
            <el-button
                type="text"
                icon="Delete"
                text-color="danger"
                @click="deleteExclusiveGiftConfig(scope.row.giftName)"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态提示 -->
      <el-empty
          description="暂无定制礼物配置，所有礼物将使用全局默认配置"
          style="margin: 20px 0;"
          v-else
      />

      <el-alert
          title="说明：1. 仅保存本地媒体文件路径，删除文件将自动回退到全局默认媒体；2. 礼物名称需与实际接收的礼物名称完全一致，否则无法匹配"
          type="warning"
          :closable="false"
          size="small"
          style="margin-top: 10px;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted,toRaw } from "vue";
import { ElMessage, ElMessageBox, FormInstance } from "element-plus";

// 全局配置表单Ref
const globalConfigFormRef = ref<FormInstance>();

// 全局默认配置（兜底配置，未定制礼物自动使用）
const globalConfigForm = reactive({
  mediaType: 'gif' as 'gif' | 'mp4',
  mediaPath: '', // 全局自定义媒体路径，为空则使用项目内置/default-gift.gif
  volume: 1,
  rate: 1,
  pitch: 1,
  delay: 1500,
  isBuffed:false,
  isUserInfo:true,
  defaultTemplate: '感谢{{uname}}赠送了{{num}}个{{gift_name}}，谢谢支持！', // 全局默认播报模板
  windowTitle: '主播的感谢',
  titleBarOpacity: 1,
  windowBgColor: 'rgba(0, 0, 0, 1)',
  userInfoColor: 'rgba(0, 0, 0, 1)'
});

// 全局表单校验规则
const globalFormRules = reactive({
  mediaType: [{ required: true, message: '请选择全局默认媒体类型', trigger: 'change' }],
  volume: [{ required: true, message: '请设置全局默认音量', trigger: 'change' }],
  rate: [{ required: true, message: '请设置全局默认语速', trigger: 'change' }],
  pitch: [{ required: true, message: '请设置全局默认音调', trigger: 'change' }],
  delay: [{ required: true, message: '请设置全局默认动画延时', trigger: 'change' }],
  defaultTemplate: [{ required: true, message: '请输入全局默认播报模板', trigger: 'blur' }],
  windowTitle: [{ required: true, message: '请输入子页面标题', trigger: 'blur' }],
  titleBarOpacity: [{ required: true, message: '请设置标题栏透明度', trigger: 'change' }],
  windowBgColor: [{ required: true, message: '请选择子页面背景色', trigger: 'change' }]
});

// 新增专属礼物配置表单
const newExclusiveGiftForm = reactive({
  giftName: '', // 如：小花花
  mediaType: 'gif' as 'gif' | 'mp4',
  mediaPath: '', // 专属媒体路径
  exclusiveTemplate: '' // 专属播报模板
});

// 礼物专属配置（仅存储需要定制的礼物，初始为空）
const exclusiveGiftConfig = reactive<Record<string, {
  mediaType: 'gif' | 'mp4',
  mediaPath: string,
  exclusiveTemplate: string
}>>({});

// 格式化专属礼物配置为表格数据
const exclusiveGiftList = computed(() => {
  return Object.entries(exclusiveGiftConfig).map(([giftName, config]) => ({
    giftName,
    mediaType: config.mediaType,
    mediaPath: config.mediaPath,
    exclusiveTemplate: config.exclusiveTemplate
  }));
});

// 媒体路径格式化（区分本地路径和项目内置路径）
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

// 选择全局默认媒体
const selectGlobalMedia = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = globalConfigForm.mediaType === 'gif'
      ? 'image/gif,image/apng,image/webp'
      : 'video/mp4,video/mov,video/webm';

  fileInput.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.[0]) {
      globalConfigForm.mediaPath = target.files[0].path;
    }
  };

  fileInput.click();
};

// 选择专属礼物媒体
const selectExclusiveGiftMedia = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = newExclusiveGiftForm.mediaType === 'gif'
      ? 'image/gif,image/apng,image/webp'
      : 'video/mp4,video/mov,video/webm';

  fileInput.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.[0]) {
      newExclusiveGiftForm.mediaPath = target.files[0].path;
    }
  };

  fileInput.click();
};

// 重新选择专属礼物媒体
const reselectExclusiveGiftMedia = (row: any) => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = row.mediaType === 'gif'
      ? 'image/gif,image/apng,image/webp'
      : 'video/mp4,video/mov,video/webm';

  fileInput.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.[0]) {
      exclusiveGiftConfig[row.giftName].mediaPath = target.files[0].path;
    }
  };

  fileInput.click();
};

// 添加专属礼物配置（仅添加需要定制的礼物）
const addExclusiveGiftConfig = async () => {
  if (!newExclusiveGiftForm.giftName || !newExclusiveGiftForm.mediaPath) {
    ElMessage.error('请完善礼物名称和专属媒体');
    return;
  }
  try {
    // 直接生成普通对象（非 reactive 代理），避免响应式包装
    const pureGiftConfig = {
      giftName: newExclusiveGiftForm.giftName.trim(),
      mediaType: newExclusiveGiftForm.mediaType,
      mediaPath: newExclusiveGiftForm.mediaPath,
      exclusiveTemplate: newExclusiveGiftForm.exclusiveTemplate
    };

    const giftKey = pureGiftConfig.giftName;
    exclusiveGiftConfig[giftKey] = pureGiftConfig; // 即使存入 reactive，后续保存会用 toRaw 剥离

    await saveGlobalConfig();

    // 重置表单（重置为纯数据）
    newExclusiveGiftForm.giftName = '';
    newExclusiveGiftForm.mediaType = 'gif';
    newExclusiveGiftForm.mediaPath = '';
    newExclusiveGiftForm.exclusiveTemplate = '';

    ElMessage.success('专属礼物添加成功');
  } catch (e) {
    ElMessage.error('添加专属礼物失败');
    console.error('新增礼物错误:', e);
  }
};

// 删除专属礼物配置
const deleteExclusiveGiftConfig = (giftName: string) => {
  ElMessageBox.confirm(
      `确定要删除【${giftName}】的专属配置吗？删除后该礼物将使用全局默认配置`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(() => {
    delete exclusiveGiftConfig[giftName];
    ElMessage.success(`【${giftName}】专属配置已删除！`);
  }).catch(() => {});
};

// 预览全局默认播报效果
const previewGlobalBroadcast = () => {
  const voiceText = globalConfigForm.defaultTemplate
      .replace(/{{uname}}/g, '测试用户')
      .replace(/{{num}}/g, '1')
      .replace(/{{gift_name}}/g, '测试礼物');

  const utterance = new SpeechSynthesisUtterance(voiceText);
  utterance.lang = 'zh-CN';
  utterance.volume = globalConfigForm.volume;
  utterance.rate = globalConfigForm.rate;
  utterance.pitch = globalConfigForm.pitch;
  window.speechSynthesis.speak(utterance);

  ElMessage.success('正在播放全局默认播报效果！');
};

// 恢复全局默认配置（不影响专属礼物配置）
const resetGlobalConfig = () => {
  ElMessageBox.confirm(
      '确定要恢复全局默认配置吗？当前全局自定义配置将被清空，专属礼物配置不受影响',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
  ).then(() => {
    // 重置全局配置到初始状态
    globalConfigForm.mediaType = 'gif';
    globalConfigForm.mediaPath = '';
    globalConfigForm.volume = 1;
    globalConfigForm.rate = 1;
    globalConfigForm.pitch = 1;
    globalConfigForm.delay = 1500;
    globalConfigForm.defaultTemplate = '感谢{{uname}}赠送了{{num}}个{{gift_name}}，谢谢支持！';
    globalConfigForm.windowTitle = '主播的感谢';
    globalConfigForm.titleBarOpacity = 1;
    globalConfigForm.isBuffed = false;
    globalConfigForm.isUserInfo = true;
    globalConfigForm.windowBgColor = 'rgba(0, 0, 0, 1)';
    globalConfigForm.userInfoColor = 'rgba(0, 0, 0, 1)';

    // 清空全局表单校验状态
    globalConfigFormRef.value?.clearValidate();

    ElMessage.success('全局默认配置已恢复！');
  }).catch(() => {});
};

// 保存全局配置（同步保存专属礼物配置）
const saveGlobalConfig = () => {
  globalConfigFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        // 步骤1：获取 reactive 原始对象（剥离Vue响应式包装）
        const rawGlobal = toRaw(globalConfigForm);
        const rawExclusive = toRaw(exclusiveGiftConfig);

        // 步骤2：深度转换为纯JSON字符串，再解析为普通对象（彻底过滤所有隐性属性）
        const pureGlobal = JSON.parse(JSON.stringify(rawGlobal));
        const pureExclusive = JSON.parse(JSON.stringify(rawExclusive));

        // 步骤3：组装纯数据配置对象（无任何包装属性）
        const pureTotalConfig = {
          global: pureGlobal,
          exclusiveGift: pureExclusive
        };

        await window.electronAPI.saveModuleConfig('giftBroadcast', pureTotalConfig);
        ElMessage.success('配置保存成功！');
      } catch (e) {
        ElMessage.error('配置保存失败！');
        console.error('配置保存错误：', e);
      }
    } else {
      ElMessage.error('请完善必填项！');
    }
  });
};

// 页面初始化：加载本地保存的配置
onMounted(async () => {
  const savedConfig = await window.electronAPI.getModuleConfig('giftBroadcast');
  if (savedConfig) {
    try {
      Object.assign(globalConfigForm, savedConfig.global);
      Object.assign(exclusiveGiftConfig, savedConfig.exclusiveGift);
      ElMessage.success('配置加载成功！');
    } catch (e) {
      ElMessage.error('配置解析失败，将使用默认配置！');
      console.error('配置解析错误：', e);
    }
  }
});
</script>

<style scoped>
.config-page-container {
  padding: 20px;
  height: 720px;
  width: 1000px;

  margin: 0 auto;
  overflow: scroll;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.config-form-card, .gift-exclusive-card {
  //padding: 10px 20px;

}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #42b983;
  margin: 10px 0 15px 0;
}

.main-config-form {
  margin-top: 15px;
}

.media-preview-box {
  margin-top: 10px;
}

.add-gift-form {
  margin-bottom: 10px;
}

.form-btn-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>