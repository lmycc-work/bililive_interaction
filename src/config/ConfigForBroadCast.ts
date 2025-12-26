// src/config/defaultConfig.ts
// 定义配置相关类型
export interface MediaConfig {
    path: string; // 媒体文件路径（本地绝对路径）
    type: 'gif' | 'mp4'; // 媒体类型
}

export interface BroadcastConfig {
    volume: number; // 音量（0-1）
    rate: number; // 语速（0.1-10）
    pitch: number; // 音调（0-2）
    delay: number; // 动画延时隐藏时间（ms）
    isBuffed: boolean;//是否开启播报缓冲
    isUserInfo: boolean;//是否展示用户信息
    userInfoColor:string;//用户ID字体颜色
}

export interface WindowConfig {
    title: string; // 子页面标题
    titleBarOpacity: number; // 标题栏透明度（0-1）
    background: string; // 子页面背景色
}

// 单个礼物的专属配置（媒体+话术）
export interface GiftExclusiveConfig {
    media: MediaConfig; // 专属媒体配置
    template: string; // 专属播报文本模板
}

// 整体配置类型
export interface TotalConfig {
    global: {
        media: MediaConfig; // 全局默认媒体
        broadcast: BroadcastConfig; // 全局播报参数
        window: WindowConfig; // 全局窗口样式
    };
    giftExclusive: Record<string, GiftExclusiveConfig>;
}

export const defaultConfig: TotalConfig = {
    global: {
        media: {
            path: '/default-gift.gif', // 项目public目录下的默认动态图片
            type: 'gif'
        },
        broadcast: {
            volume: 1,
            rate: 1,
            pitch: 1,
            delay: 1500,
            isBuffed:false,
            isUserInfo:true,
            userInfoColor:'rgba(0, 0, 0, 1)'
        },
        window: {
            title: '主播的感谢',
            titleBarOpacity: 1,
            background: 'rgba(0, 0, 0, 1)'
        }
    },
    giftExclusive: {
        // 默认礼物专属配置示例（可自定义）
        '小花花': {
            media: {
                path: '/default-flower.gif', // 项目内默认小花花图片
                type: 'gif'
            },
            template: '感谢{{uname}}投喂的{{num}}朵{{gift_name}}捏~'
        }
    }
};

// 从localStorage获取配置（无则返回默认配置）
export const getConfigFromLocalStorage = (): TotalConfig => {
    const savedConfig = localStorage.getItem('giftBroadcastConfig');
    if (!savedConfig) {
        return JSON.parse(JSON.stringify(defaultConfig)); // 深拷贝默认配置
    }
    try {
        // 合并保存的配置与默认配置（避免缺失属性）
        const parsedConfig = JSON.parse(savedConfig);
        return {
            global: {
                ...defaultConfig.global,
                ...parsedConfig.global
            },
            giftExclusive: {
                ...defaultConfig.giftExclusive,
                ...parsedConfig.giftExclusive
            }
        };
    } catch (e) {
        console.error('配置解析失败，使用默认配置', e);
        return JSON.parse(JSON.stringify(defaultConfig));
    }
};

// 保存配置到localStorage
export const saveConfigToLocalStorage = (config: TotalConfig) => {
    localStorage.setItem('giftBroadcastConfig', JSON.stringify(config));
};