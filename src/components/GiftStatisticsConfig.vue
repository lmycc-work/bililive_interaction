
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
        <el-form-item label="礼物数量颜色" prop="numColor">
          <el-color-picker
              v-model="globalConfigForm.numColor"
              show-alpha
              format="rgba"
          />
          <el-input
              v-model="globalConfigForm.numColor"
              style="margin-left: 10px; width: 200px;"
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
  </div>

</template>
<script setup lang="ts">
import {onMounted, reactive, ref, toRaw} from "vue";
import {ElMessage, FormInstance} from "element-plus";
// 全局配置表单Ref
const globalConfigFormRef = ref<FormInstance>();

// 全局默认配置
const globalConfigForm = reactive({
  windowTitle:'主播的礼物',
  titleBarOpacity: 1,
  windowBgColor: 'rgba(0, 0, 0, 1)',
  numColor: 'rgba(255, 255, 255, 1)'
});

const saveGlobalConfig = () => {
  globalConfigFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        const rawGlobal = toRaw(globalConfigForm);
        const pureGlobal = JSON.parse(JSON.stringify(rawGlobal));
        const pureTotalConfig = {
          global: pureGlobal
        };

        await window.electronAPI.saveModuleConfig('giftStatistics', pureTotalConfig);
        ElMessage.success('配置保存成功！');
        window.electronAPI.sendDataToChild('window2', {
          _type: 'reload-config' // 这是我们约定的指令类型
        });
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
  const savedConfig = await window.electronAPI.getModuleConfig('giftStatistics');
  if (savedConfig) {
    try {
      Object.assign(globalConfigForm, savedConfig.global);
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