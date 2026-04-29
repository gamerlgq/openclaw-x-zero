# 国内小游戏投放知识库

> 覆盖微信小游戏（腾讯广告）和抖音小游戏（巨量引擎）两大平台的投放能力
> 最后更新: 2026-04-29

---

## 一、平台概览

| 维度 | 微信小游戏 | 抖音小游戏 |
|------|-----------|-----------|
| 投放平台 | 腾讯广告 (e.qq.com) | 巨量引擎 (oceanengine.com) |
| API 名称 | Marketing API | 巨量引擎开放平台 API |
| 投放层级 | 旧: 计划→广告组→创意 / 新: 广告→创意(2层) | 计划→广告组→创意(3层) |
| 核心流量 | 微信朋友圈、公众号、视频号、小程序广告位 | 抖音信息流、搜索、直播、达人合作 |
| 变现模式 | IAA(广告变现) / IAP(内购) / 混合 | IAA / IAP / IAAP |
| 激励政策 | 2026年IAA激励: 注册用户30天40% / 90天35% | 2026年社交与内容增长激励 |

---

## 二、微信小游戏投放

### 2.1 腾讯广告 Marketing API

**官方文档**: https://developers.e.qq.com/docs/guide/ads/minigame
**API清单**: https://developers.e.qq.com/docs/api/apilist

#### 投放层级结构（新版）
- **广告 (Ad)**: 设定营销目的、投放导向、预算、出价
- **创意 (Creative)**: 设定创意形式、素材、文案

#### 投放小游戏的方法及限制
1. **创建计划 (Campaign)**: 同一推广计划下推广的小游戏ID必须一致
2. **创建广告组 (AdGroup)**:
   - `promoted_object_id` 填写小游戏微信 APPID（形如 `wx_xxxxx`）
   - 小游戏ID在"小游戏管理后台-基本设置"中查询
3. **创建广告创意**:
   - 落地页类型: `PAGE_TYPE_MINI_GAME_WECHAT`
   - `page_spec` 中不需要填写信息，点击后默认进入推广的小游戏
   - 朋友圈流量: `link_name_type` 必填且只能选择 `ENTER_MINI_GAME`

#### 核心 API 接口

| 接口 | 用途 |
|------|------|
| `campaigns/add` | 创建推广计划 |
| `adgroups/add` | 创建广告组（新版为 ad/add） |
| `adcreative_templates/get` | 查询支持的创意形式 |
| `adgroups/update` | 更新广告组 |
| `adgroups/get` | 获取广告组 |
| `promoted_object/add` | 登记推广目标 |
| `reports/get` | 获取数据报告 |

#### 投放流程
1. 注册腾讯广告开发者 → 获取 access_token
2. 创建推广目标（登记小游戏 APPID）
3. 创建推广计划 → 创建广告组（设定定向、出价、预算）
4. 创建广告创意（素材+文案）
5. 提交审核 → 上线投放
6. 通过 reports 接口监控数据

### 2.2 微信小游戏 2026 年广告变现激励政策

**官方文档**: https://developers.weixin.qq.com/minigame/introduction/commercialization/guide/ad-monetization.html

#### 买量场景激励

**IAA 游戏**（内购流水/总流水 < 30%）:
- 买量场景: 腾讯广告 & 外部应用，排除 CPS 场景
- 注册激励方案二选一:
  - **选项一 轻中度**: 激励 1-30 天广告流水的 40%
  - **选项二 长线**: 激励 1-90 天广告流水的 35%
- 回流激励: >45 天流失用户回流，享受等同注册激励
- 条件: 活跃时长 > 5min

**混合变现游戏**（内购流水/总流水 ≥ 30%）:
- 买量场景: 仅腾讯广告，排除 CPS
- 注册激励: 1-30 天广告流水 40%
- 回流激励: 等同注册激励（1-30 天 40%）

#### 加热与 CPS 场景激励
- 场景: 视频号加热、CPS 视频号小任务、CPS 视频号直播推游戏
- 注册激励: 1-30 天广告流水 40%，31-90 天广告流水 10%

#### 广告金通用规则
- 适用范围: 激励广告金可转给流量主注册主体下所有小游戏广告主账户
- 发放时间: T+2 结算发放
- 使用时效: 365 天内使用，过期失效
- 染色判定: 多条件命中同一用户时，遵循最新染色判定

---

## 三、抖音小游戏投放（巨量引擎）

### 3.1 巨量引擎开放平台 API

**官方文档**: https://open.oceanengine.com/
**Go SDK**: https://github.com/bububa/oceanengine
**Java SDK**: https://github.com/oceanengine/ad_open_sdk_java
**PHP SDK**: https://github.com/westng/oceanengine-sdk-php

#### 投放层级结构
- **计划 (Campaign)**: 设定推广目标、预算类型
- **广告组 (AdGroup)**: 设定定向、出价、预算
- **创意 (Creative)**: 设定素材、文案、落地页

#### 核心 API 模块

| 模块 | 用途 |
|------|------|
| `oauth` | OAuth2.0 授权 |
| `ad/account` | 广告账户管理 |
| `ad/campaign` | 採划管理 |
| `ad/adgroup` | 广告组管理 |
| `ad/creative` | 创意管理 |
| `ad/report` | 数据报告 |
| `tools/app` | 小程序/小游戏资产管理 |
| `tools/event` | 事件管理（转化追踪） |

### 3.2 抖音小游戏投放流程

1. **开户**: 在巨量引擎平台注册广告主账户
2. **添加资产**: 资产 → 小程序/小游戏 → 新建 → 选择"小游戏" → 填写游戏ID → 审核约1小时
3. **添加事件**: 配置转化追踪事件（激活、注册、付费等）
4. **创建计划**: 选择推广目标（小游戏）→ 设定预算类型
5. **创建广告组**: 设定定向（年龄、性别、兴趣等）→ 出价方式（CPC/CPM/oCPM/ROI）→ 预算
6. **创建创意**: 素材（视频/图片）+ 文案 + 落地页
7. **审核上线** → 监控优化

#### 小游戏路径参数配置
```
?advertPlatform=oceanengine&gameType=wxminigame&mainChannel=100708&secondChannel=100709
```
- `advertPlatform`: 媒体平台标识
- `gameType`: 游戏类型
- `mainChannel` / `secondChannel`: 渠道标识

### 3.3 抖音小游戏 2026 年激励政策

- "社交与内容增长激励"，引导开发者重视内容生态
- IAP 小游戏投放产品数量增幅 363%，消耗规模增幅 +491%

### 3.4 市场数据（2025 Q1 巨量引擎）

#### 品类消耗占比
- **传统重度类**（RPG、SLG、放置卡牌、模拟经营）: 65%，持续增长
- **融合玩法类**（塔防+各类融合like）: < 30%，持续下降
- **经典休闲类**（二合三消、轻度休闲）: 7%+，持续提升

#### Top 3 消耗品类
RPG（传奇/仙侠）+ 融合like + 塔防 ≈ 60%

#### 用户特征
- 男性 60%，18-24 岁占 44%
- 高频低时长: 近 5 成每周 5 天以上游戏，7 成单次 < 1 小时
- 深度集中: 6 成深度玩过的游戏 < 2 个
- 付费: 36% 有过付费，以小额为主
- 广告接受度: 91% 有过广告观看行为
- 新用户进入核心要素: 游戏类型/题材匹配 (35%)
- 流失主因: 需付费/看广告
- 召回主因: 宣传物料反复触达 (50%)

#### 各品类玩法建议
- **经典休闲**: 线性关卡 + 减少思考时间 + 多经典玩法叠加 + 剧情代入
- **融合玩法**: 割草清怪 + Roguelike 随机性 + 全自动战斗 + 策略调整
- **传统重度**: 保留手游系统 + 强化种田休闲感 + 简化养成 + 经济循环加速

---

## 四、两平台投放对比

| 维度 | 微信小游戏 | 抖音小游戏 |
|------|-----------|-----------|
| 投放门槛 | 较低，微信生态内闭环 | 中等，需巨量引擎开户 |
| 流量特征 | 社交裂变强、长线留存好 | 内容驱动、爆发力强 |
| 适合品类 | IAA/轻度/社交类 | 重度/IAP/内容类 |
| 出价方式 | CPC/CPM/oCPM | CPC/CPM/oCPM/ROI |
| 创意形式 | 图片+视频+试玩 | 短视频为主+直播 |
| 激励力度 | 注册30天40%/90天35% | 2026年社交内容激励 |
| API 成熟度 | Marketing API 完善 | 开放平台 API 完善 |
| SDK 支持 | 官方PHP/Python/Java | 官方Java/Go/PHP |

---

## 五、关键文档索引

### 官方文档
- [微信小游戏广告变现激励政策](https://developers.weixin.qq.com/minigame/introduction/commercialization/guide/ad-monetization.html)
- [腾讯广告 Marketing API - 小游戏推广](https://developers.e.qq.com/docs/guide/ads/minigame)
- [腾讯广告 API 接口清单](https://developers.e.qq.com/docs/api/apilist)
- [巨量引擎开放平台](https://open.oceanengine.com/)
- [巨量引擎游戏行业营销场景](https://developers.e.qq.com/docs/guide/ads/marketingscene)

### SDK
- [巨量引擎 Go SDK](https://github.com/bububa/oceanengine)
- [巨量引擎 Java SDK](https://github.com/oceanengine/ad_open_sdk_java)
- [巨量引擎 PHP SDK](https://github.com/westng/oceanengine-sdk-php)

### 行业报告
- [巨量引擎 IAP/IAAP 小游戏行业洞察 & 投放指南](https://bytedance.larkoffice.com/docx/PEkidX0I2oI9Umxby9qcxFaTncV)
- [微信小游戏买量推广与增长攻略](https://developers.weixin.qq.com/community/business/doc/0008ee59348e688bed9d82f335180d)

---

## 六、待补充

- [ ] 腾讯广告 API 实际调用示例（access_token 获取、创建广告组等）
- [ ] 巨量引擎 API 实际调用示例
- [ ] 两平台数据归因与回传配置细节
- [ ] 素材审核规则与常见拒审原因
- [ ] 出价策略优化实操（oCPM/ROI 出价调优）
- [ ] 跨平台投放策略（微信+抖音联合买量）
