# 出价策略优化实操：oCPM/ROI 出价调优

> 覆盖腾讯广告（微信小游戏）和巨量引擎（抖音小游戏）的出价模式、策略选择与调优方法
> 最后更新: 2026-04-30

---

## 一、出价模式总览

### 1.1 出价方式对比

| 出价方式 | 计费方式 | 说明 | 适用场景 |
|----------|---------|------|---------|
| **CPC** | 按点击计费 | 手动出价，按点击扣费 | 品牌曝光、流量测试 |
| **CPM** | 按千次展示计费 | 手动出价，按展示扣费 | 大促曝光、品牌覆盖 |
| **oCPM** | 按展示计费 + 智能优化 | 模型预估转化率，智能调价 | **小游戏最常用** |
| **oCPA** | 按下载/激活计费 + 智能优化 | 针对应用推广的智能出价 | App 下载推广 |
| **ROI 出价** | 按展示计费 + ROI 目标约束 | 模型确保 ROI 达标前提下最大化量 | IAA/IAP 小游戏推荐 |

### 1.2 为什么小游戏首选 oCPM / ROI 出价？

- 小游戏 KPI 核心是**转化成本（CPA）**和**投资回报率（ROI）**，纯 CPC/CPM 无法直接优化这些指标
- oCPM：按展示计费，模型自动寻找高转化率人群，以目标 CPA 为优化方向
- ROI 出价：在保证 ROI 达标的前提下最大化拿量，最适合追求回本的投放

---

## 二、腾讯广告（微信小游戏）出价策略

### 2.1 可用优化目标

微信小游戏 (`PROMOTED_OBJECT_TYPE_MINI_GAME_WECHAT`) 支持的优化目标：

| 优化目标 | API 枚举值 | 说明 |
|----------|-----------|------|
| 点击 | `OPTIMIZATIONGOAL_CLICK` | 仅朋友圈版位 |
| 注册 | `OPTIMIZATIONGOAL_APP_REGISTER` | **核心目标** |
| 广告变现 | `OPTIMIZATIONGOAL_MOBILE_APP_AD_INCOME` | 灰度，IAA 适用 |
| 首次付费 | `OPTIMIZATIONGOAL_FIRST_PURCHASE` | **深度目标** |
| 关键页面访问(>30s) | `OPTIMIZATIONGOAL_PROMOTION_VIEW_KEY_PAGE` | 留存指标 |
| 小游戏创角 | `OPTIMIZATIONGOAL_MOBILE_APP_CREATE_ROLE` | 深层转化 |

### 2.2 深度转化优化（双目标出价）

深度优化的核心思路：浅层目标起量 → 积累深度数据 → 模型切换到深度目标优化

**微信小游戏深度优化组合**：

| 浅层优化目标 | 深层优化目标 | 适用场景 |
|-------------|-------------|---------|
| 注册 | 首次付费 | **IAP/混合变现小游戏首选** |
| 注册 | 次日留存 | 留存导向的 IAA 游戏 |

**两阶段机制**：
- **一阶段**：积累 < 6 个深度转化前，优化浅层目标（注册成本接近出价）
- **二阶段**：积累 ≥ 6 个深度转化后，模型切换优化深度目标（深度成本接近出价）

> ⚠️ 一阶段不保证深层成本，二阶段不保证浅层成本。对某个指标极度敏感 → 直接用单目标出价。

### 2.3 API 创建深度优化广告组

```bash
curl 'https://api.e.qq.com/v1.1/adgroups/add?access_token=<ACCESS_TOKEN>&timestamp=<TIMESTAMP>&nonce=<NONCE>' \
  -d 'account_id=<ACCOUNT_ID>' \
  -d 'campaign_id=<CAMPAIGN_ID>' \
  -d 'adgroup_name=小游戏-注册+首付深度优化' \
  -d 'promoted_object_type=PROMOTED_OBJECT_TYPE_MINI_GAME_WECHAT' \
  -d 'optimization_goal=OPTIMIZATIONGOAL_APP_REGISTER' \
  -d 'billing_event=BILLINGEVENT_IMPRESSION' \
  -d 'bid_amount=5000' \
  -d 'deep_conversion_spec={
    "deep_conversion_type": "DEEP_CONVERSION_BEHAVIOR",
    "deep_conversion_behavior_spec": {
      "goal": "OPTIMIZATIONGOAL_FIRST_PURCHASE",
      "bid_amount": 50000
    }
  }'
```

**关键参数**：
- `optimization_goal`：浅层目标（如注册）
- `bid_amount`：浅层目标出价（单位：分，5000 = 50元）
- `deep_conversion_spec.deep_conversion_behavior_spec.goal`：深层目标（如首次付费）
- `deep_conversion_spec.deep_conversion_behavior_spec.bid_amount`：深层目标出价（单位：分）

### 2.4 最大转化量投放（Nobid）

腾讯广告为小游戏提供了 **Nobid（最大转化量投放）** 工具：

| 功能 | 说明 |
|------|------|
| 自动出价 | 系统根据日预算自动优化出价，无需手动设出价 |
| 目标 | 在预算内最大化转化量 |
| 适用 | 新游测试期、预算有限探索量级 |
| 风险 | CPA 可能波动较大 |

**API 调用**：设置 `bid_amount` 为 0 或不设出价，搭配 `delivery_mode=DELIVERY_MODE_FAST`（加速投放）

### 2.5 出价调优实战指南

#### 冷启动期（前 3-5 天）

| 操作 | 建议 |
|------|------|
| 初始出价 | 注册出价设为预期 CPA 的 1.2-1.5 倍（帮助模型快速学习） |
| 预算 | 单条广告日预算 ≥ 出价 × 20（确保每天至少 20 个转化） |
| 素材 | 3-5 套不同素材，2-3 天一换 |
| 定向 | 初期适当放宽，帮助积累数据 |
| 观察期 | 不要频繁调价（一天最多 1 次，幅度 ≤ 20%） |

#### 稳定期调价

| 场景 | 操作 |
|------|------|
| CPA 低于目标，量不够 | 提价 10-20%，观察量级变化 |
| CPA 高于目标 | 降价 10-15%，观察成本是否回落 |
| 量级突然下降 | 检查素材是否衰退、竞价环境是否变化 |
| ROI 不达标 | 切换深度优化目标（注册→首付），或调整深度出价 |

#### 深度优化切换时机

| 数据指标 | 判断 |
|----------|------|
| 日均注册 ≥ 50，但首日付费率 < 3% | 切换到"注册+首次付费"深度优化 |
| 次留 < 20% | 切换到"注册+次日留存"深度优化 |
| 首付 CPA 波动大 | 确保回传数据及时（≤ 5 分钟），积累更多数据 |

---

## 三、巨量引擎（抖音小游戏）出价策略

### 3.1 可用出价方式

| 出价方式 | API 枚举值 | 说明 |
|----------|-----------|------|
| CPC | `PRICING_CPC` | 手动按点击计费 |
| CPM | `PRICING_CPM` | 手动按展示计费 |
| oCPM | `PRICING_OCPM` | **最常用**，按展示计费 + 智能优化 |
| ROI 出价 | `PRICING_ROI` | **IAP 小游戏推荐**，按 ROI 目标优化 |

### 3.2 可用优化目标

| 优化目标 | API 枚举值 | 说明 |
|----------|-----------|------|
| 激活 | `OPTIMIZATIONGOAL_APP_ACTIVATE` | 基础目标 |
| 注册 | `OPTIMIZATIONGOAL_APP_REGISTER` | 中浅层 |
| 付费 | `OPTIMIZATIONGOAL_APP_PURCHASE` | 深层 |
| 关键行为 | `game_addiction` | 自定义关键行为（如在线时长、关卡达成） |
| 次留 | `OPTIMIZATIONGOAL_LIVE` | 留存导向 |

### 3.3 ROI 出价模式（抖小 IAA 必用）

**核心原理**：广告主设置 ROI 目标系数，平台根据 ROI 目标 + 数据模型，动态寻找满足 ROI 要求的优质流量。

#### ROI 出价操作要点

| 配置项 | 建议 |
|--------|------|
| 系数设置 | 不超过实际考核标准的 20% 范围（目标过高不利于跑量） |
| 基建标准 | 单产品 5 账户 × 5 项目 × 5 广告 × 5 素材 |
| 看数口径 | 激活后 24h ROI（高于首日 ROI ≈ 10pp） |
| 系数调优 | 降系数 ≈ 提价增量，提系数 ≈ 降价保效果 |

#### ROI 出价数据表现（参考）

| 指标 | 数据 |
|------|------|
| ROI 出价效果达成率 | 105%+ 稳定波动 |
| 客户入局率 | 70%+ 已测试 |
| 适配 UBA 后量级提升 | 30%-50% |
| 激活成本 | 仅为关键行为的 1/10 |

### 3.4 V3 体验版（项目 → 广告）

V3 体验版简化了投放层级，从三层的"计划→广告组→创意"变为两层的"项目→广告"：

```bash
# 创建项目
curl -X POST 'https://ad.oceanengine.com/openapi/v3.0/project/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "project_name": "小游戏项目-ROI出价",
    "budget_mode": "BUDGET_MODE_DAY",
    "budget": 500000,
    "roi_goal": 0.15
  }'

# 创建广告（oCPM 出价）
curl -X POST 'https://ad.oceanengine.com/openapi/v3.0/promotion/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "project_id": <PROJECT_ID>,
    "promotion_name": "小游戏-激活优化",
    "promotion_type": "PROMOTION_TYPE_NORMAL",
    "pricing": "PRICING_OCPM",
    "optimization_goal": "OPTIMIZATIONGOAL_APP_ACTIVATE",
    "cpa_bid": 500
  }'

# 创建广告（ROI 出价）
curl -X POST 'https://ad.oceanengine.com/openapi/v3.0/promotion/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "project_id": <PROJECT_ID>,
    "promotion_name": "小游戏-ROI出价",
    "promotion_type": "PROMOTION_TYPE_NORMAL",
    "pricing": "PRICING_ROI",
    "roi_goal": 0.15,
    "optimization_goal": "OPTIMIZATIONGOAL_APP_PURCHASE"
  }'
```

### 3.5 基建数量 Benchmark

| 日耗目标 | 日均有消耗账户 | 日均有效计划 | 日均新建计划 | 日均有消耗素材 | 基建配比 |
|----------|--------------|------------|------------|--------------|---------|
| 50w+ | 100+ | 3000+ | 1500+ | 800+ | 单账户在投计划 15-20 条 |
| 10-50w | 50+ | 1500+ | 500+ | 500+ | 单素材在投计划 ≤ 5 条 |
| 0-10w | 20+ | 600+ | 100+ | 200+ | 新素材占比 15-20% |

> "基建不是万能，基建不足是万万不能的！"

### 3.6 出价调优实战指南

#### 冷启动期（前 3-7 天）

| 操作 | 建议 |
|------|------|
| 初始出价 | CPA 出价的 1.2-1.5 倍（模型需要数据学习） |
| 日预算 | ≥ 出价 × 30（确保足够转化积累） |
| 基建 | 多账户 × 多项目 × 多广告 × 多素材 |
| 素材 | 新素材占比 15-20%，避免老素材挤压 |
| 回传 | 确保激活/付费回传 ≤ 5 分钟 |

#### 稳定期调价

| 场景 | 操作 |
|------|------|
| 成本达标但量不够 | 提价 10-15% 或降低 ROI 系数 |
| 成本偏高 | 降价 10-15% 或提高 ROI 系数 |
| ROI 出价跑不出量 | 检查系数设置（降低 10-20% 尝试） |
| 量级突然下降 | 素材衰退 → 更换新素材 |
| 模型学习不稳 | 增加 daily budget、放宽定向 |

#### ROI 出价调优

| 场景 | 操作 |
|------|------|
| ROI > 目标，量少 | 降系数（如从 0.20 降到 0.15），跑更多量 |
| ROI < 目标，成本高 | 提系数（如从 0.10 提到 0.15），保效果 |
| 刚开始跑不出量 | 系数设为考核目标的 1.1-1.2 倍 |
| 激活后 24h ROI 偏低 | 检查付费回传是否及时 |

---

## 四、两平台出价策略对比

| 维度 | 腾讯广告 | 巨量引擎 |
|------|---------|---------|
| **主流出价** | oCPM | oCPM / ROI |
| **小游戏优化目标** | 注册/广告变现/首次付费/创角/关键页面 | 激活/注册/付费/关键行为/次留 |
| **深度优化** | 双目标（注册+首付/注册+次留） | 不支持双目标，但可设 ROI 出价 |
| **ROI 出价** | 注册+首日付费ROI（灰度） | ROI 出价成熟，IAA 100% 必用 |
| **智能出价工具** | Nobid（最大转化量） | UBA（自动出价） |
| **冷启动门槛** | 零门槛（但数据越多越稳定） | 日均转化 ≥ 50 条模型稳定 |
| **深度优化切换** | 积累 6 个深度转化后自动切换 | — |
| **调价频率** | 一天最多 1 次，幅度 ≤ 20% | 一天最多 2-3 次 |
| **V3 投放层级** | 广告→创意（2 层） | 项目→广告（2 层，V3 体验版） |

---

## 五、出价策略组合推荐

### 5.1 IAA 小游戏（广告变现为主）

| 阶段 | 腾讯广告 | 巨量引擎 |
|------|---------|---------|
| 冷启动 | 注册 oCPM + 注册出价 1.2x | 激活 oCPM + CPA 1.3x |
| 起量期 | 注册+次留深度优化 | 激活 oCPM → 切 ROI 出价 |
| 稳定期 | 广告变现 oCPM（灰度） | ROI 出价（核心） |

### 5.2 IAP 小游戏（内购为主）

| 阶段 | 腾讯广告 | 巨量引擎 |
|------|---------|---------|
| 冷启动 | 注册 oCPM | 激活 oCPM |
| 起量期 | 注册+首次付费深度优化 | 付费 oCPM |
| 稳定期 | 首次付费 oCPM | ROI 出价 + 付费优化 |

### 5.3 IAAP 小游戏（混合变现）

| 阶段 | 腾讯广告 | 巨量引擎 |
|------|---------|---------|
| 冷启动 | 注册 oCPM | 激活 oCPM |
| 起量期 | 注册+首次付费深度优化 | ROI 出价（低系数起量） |
| 稳定期 | 首付 oCPM / 广告变现 oCPM | ROI 出价（逐步提系数保效果） |

---

## 六、常见问题与排错

### Q1: oCPM 冷启动跑不出量怎么办？
- 检查预算是否充足（日预算 ≥ 出价 × 20）
- 提高出价 20-50%（模型需要信号学习）
- 放宽定向，增加覆盖人群
- 确保回传数据及时、完整
- 素材是否吸引力不足 → 更换素材

### Q2: 深度优化一直卡在一阶段（无法进二阶段）？
- 深层数据不足 → 确保首日付费回传及时
- 浅层出价过低 → 提高出价帮助积累深层转化
- 目标组合不当 → 注册→首付 是最常见组合，确保转化链路正确

### Q3: ROI 出价成本偏高怎么办？
- 检查系数是否设太低 → 提高系数 10-15%
- 付费回传是否延迟 → 确保实时回传
- 板子素材是否衰退 → 更换新素材
- 是否回传数据量不足 → 日均转化 ≥ 50

### Q4: 调价后效果变差了？
- 调价幅度太大（建议 ≤ 20%）
- 调价后需要 2-4 小时观察期，不要太快二次调整
- 频繁调价会干扰模型学习 → 一天最多调 1-2 次

### Q5: 腾讯广告注册+首日付费 ROI 怎么设置？
- 推广目标选微信小游戏
- 浅层优化目标：注册，出价设注册 CPA
- 深层优化目标：首次付费，出价设首日付费用户价值
- 系统先优化注册成本，积累足够首日后转向优化付费ROI

---

## 七、关键文档索引

### 官方文档
- [腾讯广告 oCPC/oCPM 智能出价](https://developers.e.qq.com/docs/guide/ads/ocpa)
- [腾讯广告 oCPC/oCPM 深度转化优化](https://developers.e.qq.com/docs/guide/ads/deep_optimization)
- [腾讯广告小游戏买量推广与增长攻略 (PDF)](https://training.tencentads.com/uploads/202406/XjoUfkBl_ExGwb9.pdf)
- [巨量引擎 ROI 出价指南](https://developer.open-douyin.com/forum/share/post/66724a866232cb1d6538d166)
- [巨量引擎 IAP/IAAP 小游戏行业洞察 & 投放指南](https://bytedance.larkoffice.com/docx/PEkidX0I2oI9Umxby9qcxFaTncV)

### 经验分享
- [微信小游戏注册+首日付费ROI玩法](https://www.opp2.com/311685.html)
- [ROI 提升 20% 的关键操作](https://developer.cloud.tencent.com/news/891594)