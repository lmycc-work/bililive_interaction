<template>
  <div class="config-page-container">
    <!-- 配置页面标题 -->
    <div class="page-title">上舰播报配置中心</div>
    <el-card shadow="hover" >
      <el-form
          :model="globalConfigForm"
          label-width="120px"
          ref="globalConfigFormRef"
          class="main-config-form"
      >
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
        <el-form-item label="打字机间隔（ms）" prop="delay">
          <el-slider
              v-model="globalConfigForm.delay"
              :min="100"
              :max="1000"
              :step="50"
              show-input
              show-input-controls
          />
        </el-form-item>
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
    <el-card shadow="hover" class="gift-exclusive-card" style="margin-top: 20px;">
      <div class="card-title">上舰动画配置</div>
      <el-form
          label-width="80px"
          inline
          class="add-gift-form"
      >
        <el-form-item label="专属媒体">
          <el-button
              type="primary"
              icon="Upload"
              @click="selectExclusiveShipMedia"
              style="width: 120px;"
          >
            选择媒体
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button
              type="success"
              icon="Plus"
              @click="addExclusiveShipConfig"
          >
            添加专属配置
          </el-button>
        </el-form-item>
      </el-form>
      <div>
        <div v-if="newShipMedia !='' " class="media-preview-box">
          <video
              :src="getMediaUrl(newShipMedia)"
              autoplay
              loop
              style="width: 200px; height: 200px;object-fit: contain;"
          />
        </div>
      </div>
      <!-- 专属礼物配置表格 -->
      <el-table
          :data="media"
          border
          style="margin-top: 15px;"
          :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column prop="media" label="专属媒体路径" align="center">
          <template #default="scope">
            <el-input
                v-model="scope.row"
                readonly
                size="small"
                style="width: 680px;"
            >
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100">
          <template #default="scope">
            <el-button
                type="text"
                icon="Delete"
                text-color="danger"
                @click="deleteExclusiveShipConfig(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>

    </el-card>
  </div>
</template>
<script setup lang="ts">
import {onMounted, reactive, ref, toRaw} from "vue";
import {ElMessage, FormInstance} from "element-plus";

// 全局配置表单Ref
const globalConfigFormRef = ref<FormInstance>();

// 全局默认配置
const globalConfigForm = reactive({
  isMuted: false,
  windowTitle: '主播的舰长',
  titleBarOpacity: 1,
  isUserInfo: true,
  delay:200,
  windowBgColor: 'rgba(0, 0, 0, 1)',
  userInfoColor: 'rgba(0, 0, 0, 1)'
});
const media = reactive<string[]>([]);
let newShipMedia = ref<string>('')

const resetGlobalConfig = () => {
  console.log("重置")
}


const selectExclusiveShipMedia = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept =  'video/mp4,video/mov,video/webm';
  fileInput.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    newShipMedia.value = target.files?.[0]?.path ?? '';
  };
  fileInput.click();
};

const deleteExclusiveShipConfig = async (path:string) =>{
  const index = media.findIndex(item => item === path);
  if (index === -1) {
    ElMessage.warning('该媒体路径不存在');
    return;
  }
  media.splice(index, 1); // 从索引index处删除1个元素
  ElMessage.success('媒体路径删除成功');
  await saveGlobalConfig();
}

const addExclusiveShipConfig = async () => {
  try {
    if (newShipMedia.value == ''){
      ElMessage.error('未选择任何媒体')
      return
    }
    if (media.includes(newShipMedia.value)) {
      ElMessage.info('该媒体路径已存在，无需重复添加');
      return;
    }
    media.push(newShipMedia.value)

    await saveGlobalConfig();

    newShipMedia.value = ''

    ElMessage.success('添加成功');
  } catch (e) {
    ElMessage.error('失败');
    console.error('新增错误:', e);
  }
}
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

// 保存全局配置（同步保存专属礼物配置）
const saveGlobalConfig = () => {
  globalConfigFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        // 步骤1：获取 reactive 原始对象
        const rawGlobal = toRaw(globalConfigForm);
        const rawExclusive = toRaw(media);

        // 步骤2：深度转换为纯JSON字符串，再解析为普通对象
        const pureGlobal = JSON.parse(JSON.stringify(rawGlobal));
        const pureExclusive = JSON.parse(JSON.stringify(rawExclusive));

        // 步骤3：组装纯数据配置对象（无任何包装属性）
        const pureTotalConfig = {
          global: pureGlobal,
          media: pureExclusive
        };

        await window.electronAPI.saveModuleConfig('shipLoad', pureTotalConfig);
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


onMounted(async () => {
  const savedConfig = await window.electronAPI.getModuleConfig('shipLoad');
  if (savedConfig) {
    try {
      Object.assign(globalConfigForm, savedConfig.global);
      Object.assign(media, savedConfig.media);
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