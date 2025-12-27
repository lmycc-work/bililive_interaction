
<template>
<div>礼物统计配置</div>
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
  numColor: 'rgba(0, 0, 0, 1)'
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

</style>