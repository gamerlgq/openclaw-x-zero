# 数据归因与转化回传配置

> 覆盖腾讯广告（微信小游戏）和巨量引擎（抖音小游戏）两大平台的归因链路和回传接口
> 最后更新: 2026-04-30

---

## 一、归因基本概念

| 概念 | 说明 |
|------|------|
| **归因 (Attribution)** | 将用户转化行为（激活、注册、付费等）归因到触发了该行为的广告点击 |
| **转化回传 (Callback)** | 广告主将用户在小游戏内的转化行为数据上报给广告平台，以便平台优化投放 |
| **点击标识** | 每次广告点击的唯一 ID，用于关联点击和后续转化 |
| **归因窗口** | 转化行为可被归因到点击的时间范围（通常 7/14/28 天） |
| **归因口径** | 点击归因：首个点击；注册归因：首个注册节点 |

**为什么要回传转化数据？**
- 广告平台根据回传数据优化 oCPM/ROI 智能出价
- 没有回传数据 → 平台无法学习 → 出价模型退化 → 成本飙升
- 回传越准、越及时 → 模型学习越快 → 获客成本越低

---

## 二、腾讯广告（微信小游戏）归因与回传

### 2.1 归因口径

微信小游戏统一采用**注册归因**口径：用户注册后的行为（创角、付费等）会归因到前置的注册事件。

QQ 小游戏统一采用**点击归因**口径：转化归因到带来该用户的首次点击。

### 2.2 归因标识获取

| 标识 | 来源 | 说明 |
|------|------|------|
| `__CALLBACK__` (cb) | 广告点击 URL 参数 | URLDecode 后作为上报地址使用，每次点击唯一 |
| `click_id` (即 gdt_vid) | 小游戏数据监控参数 | 微信广告 traceid，唯一标识一次点击 |
| `wechat_openid` | 小游戏服务端获取 | 用户在小游戏内的 openid |
| `wechat_app_id` | 小游戏 APPID | `wx_xxxxx` 格式，必须在 DataNexus 授权 |

**cb 获取流程**：
1. 广告投放时，点击链接包含 `__CALLBACK__` 参数
2. 用户从广告点击进入小游戏时，URL 中的 `__CALLBACK__` 参数被传递到小游戏
3. 小游戏服务端 URLDecode 获取 cb 值
4. 后续转化上报时，将 cb 作为上报地址的一部分

**click_id 获取流程**：
1. 广告点击后，小游戏启动参数中包含 `gdt_vid` 字段
2. 该字段即 click_id（微信广告 traceid）

### 2.3 前置条件：微信 AppID 授权

上传微信行为数据前，**必须**在 DataNexus 完成小程序 AppID 授权：

1. 进入 [DataNexus](https://dmp.qq.com) → 工具箱 → 申请微信 AppID
2. 提交小游戏 AppID（`wx_xxx` 格式）进行授权
3. 未授权或 AppID 与 openid 不匹配 → 归因失败

### 2.4 回传方式一：Callback 上报（推荐）

**适用场景**：在创建转化时填写了点击监测链接

#### 2.4.1 鉴权升级（2025年Q3起强制）

自 2025 年 3 月 31 日起，腾讯广告不再支持 HTTP 协议及未鉴权上报。需切换为 HTTPS + 鉴权：

| 鉴权状态 | CALLBACK URL 格式 | 新增校验 |
|----------|-------------------|----------|
| **开启鉴权** | `https://api.e.qq.com/conv?cb=...&conv_id=123` | 上报需带 `access-token`、`timestamp`、`nonce` |
| 关闭鉴权（即将废弃） | `http://tracking.e.qq.com/conv?cb=...&conv_id=123` | 无 |

> ⚠️ 2025 年 Q3 起，所有 CALLBACK 将自动切换为鉴权模式，请尽早排期。

#### 2.4.2 鉴权上报请求示例

```bash
curl -X POST \
  'https://api.e.qq.com/v3.0/user_actions/add?cb=YWRzX......iOWNi&conv_id=10001' \
  -H 'Content-Type: application/json' \
  -H 'access-token: <ACCESS_TOKEN>' \
  -H 'timestamp: <TIMESTAMP>' \
  -H 'nonce: <NONCE>' \
  -H 'cache-control: no-cache' \
  -d '{
    "actions": [
      {
        "outer_action_id": "unique_action_id_001",
        "action_time": 1746000000,
        "user_id": {
          "wechat_app_id": "wx1234567890abcdef",
          "wechat_openid": "o6_bmas222xxxxxxxxxxxxxx"
        },
        "action_type": "ACTIVATE_APP",
        "action_param": {
          "value": 0
        }
      }
    ]
  }'
```

**必填字段**：
- `cb` + `conv_id`：从 __CALLBACK__ 字段 URLDecode 获得（URL 中的路径参数）
- `access-token` / `timestamp` / `nonce`：鉴权参数（Header）
- `wechat_app_id`：小游戏 APPID（需已授权）
- `wechat_openid`：用户 openid（填写 wechat_app_id 时必填）
- `action_type`：行为类型

### 2.5 回传方式二：Click ID 上报 + 数据源（QQ 小游戏 / 无监测链接）

**适用场景**：QQ 小游戏、或微信小游戏未配置监测链接

```bash
curl -X POST \
  'https://api.e.qq.com/v1.1/user_actions/add?access_token=<ACCESS_TOKEN>&timestamp=<TIMESTAMP>&nonce=<NONCE>' \
  -H 'Content-Type: application/json' \
  -d '{
    "account_id": "<ACCOUNT_ID>",
    "user_action_set_id": "<USER_ACTION_SET_ID>",
    "actions": [
      {
        "outer_action_id": "unique_action_id_001",
        "action_time": 1746000000,
        "user_id": {
          "wechat_openid": "o6_bmas222xxxxxxxxxxxxxx",
          "wechat_unionid": "o6_bmasxxxxxxxxxxxxxx",
          "wechat_app_id": "wx1234567890abcdef"
        },
        "action_type": "PURCHASE",
        "trace": {
          "click_id": "abc123"
        },
        "action_param": {
          "value": 2800,
          "quantity": 1
        },
        "channel": "TENCENT"
      }
    ]
  }'
```

**关键字段**：
- `user_action_set_id`：数据源 ID（在 DataNexus 创建）
- `account_id`：上报账户（1 个上报账户可归因到多个投放账户）
- `trace.click_id`：必填，广告点击唯一标识
- `channel`：流量来源（`TENCENT` / `NATURAL`）

### 2.6 小游戏常用行为类型 (action_type)

| 行为名称 | ActionType | 数据指标 | 说明 |
|----------|-----------|----------|------|
| 激活 | `ACTIVATE_APP` | 激活人数 | 用户首次打开小游戏 |
| 注册 | `RESERVATION` | 注册人数 | 用户完成注册 |
| 付费 | `PURCHASE` | 付费次数 / 金额 | 用户购买道具等付费行为 |
| 次留 | `START_APP` | 次留人数 | 次日再次进入小游戏 |
| 创角 | `CREATE_ROLE` | 创角人数 | 小游戏内角色创建 |
| 关键页面访问 | — | 停留 >30s 人数 | 平台自动上报，无需回传 |
| 下单 | `COMPLETE_ORDER` | 下单次数 / 金额 | 完整订单行为 |

### 2.7 action_param 常用参数

| 参数 | 类型 | 说明 | 必填 |
|------|------|------|------|
| `value` | int | 订单价值，单位：分 | 否（PURCHASE/COMPLETE_ORDER 建议填） |
| `quantity` | int | 购买数量 | 否 |
| `brand_name` | string | 品牌名称 | 否 |
| `string_example` | string | 自定义字符串 | 否 |
| `int_array_example` | int[] | 自定义整型数组 | 否 |

### 2.8 去重机制

通过 `outer_action_id` 字段实现幂等去重：

- 平台基于 `user_action_set_id` + `outer_action_id` + `action_type` 三字段去重
- 若历史数据中三字段完全相同 → 当前数据被过滤
- 长度限制：1-255 字节，仅支持数字、字母、下划线、连接符

### 2.9 错误码速查

| 错误码 | 说明 |
|--------|------|
| 20001 | CALLBACK URL 内容错误 |
| 20002 | 转化 ID 无对应转化规则 |
| 20003 | 无效数据源 ID |
| 20004 | 无效账户 ID |
| 20005 | Base64 密钥编码失败 |
| 20006 | CALLBACK Base64 解码失败 |
| 30000 | API 访问失败 |

### 2.10 微信小游戏完整回传流程图

```
广告点击 → 小游戏启动
              ↓
         获取 __CALLBACK__ / click_id / gdt_vid
              ↓
         用户进入小游戏 → 触发转化事件
              ↓
         服务端构造上报请求
         (cb/click_id + openid + action_type)
              ↓
         POST → tracking.e.qq.com/conv 或 api.e.qq.com/user_actions/add
              ↓
         返回 {"code": 0} → 上报成功
              ↓
         投放端报表呈现归因数据 → oCPM 模型优化出价
```

---

## 三、巨量引擎（抖音小游戏）归因与回传

### 3.1 归因方式

巨量引擎小游戏采用**点击归因**口径，基于 `callback` 参数或 SDK 归因。

#### 归因标识获取

| 标识 | 来源 | 说明 |
|------|------|------|
| `callback` | 广告点击 URL 参数 | 回传地址，从启动参数中获取 |
| `Click ID` (__REQSIG__) | 广告点击 URL 参数 | 设备级归因标识 |
| `url` + `token` | 巨量引擎后台获取 | 事件管理平台回传配置 |

**url & token 获取路径**：
- 广告投放平台 → 资产 → 小程序/小游戏 → 微信小游戏 → 点击「转化上报」
- 复制 URL 和 Token（多账户时，任一账户获取即可）

### 3.2 事件管理平台配置

巨量引擎使用**事件管理平台**（原转化跟踪）管理转化回传：

#### 3.2.1 创建资产

```bash
# 查询已有资产
curl 'https://ad.oceanengine.com/openapi/v1.0/event_manager/assets/get/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -d 'advertiser_id=<ADVERTISER_ID>&asset_type=MINI_GAME'

# 创建事件资产
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/event_manager/assets/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "asset_type": "MINI_GAME",
    "asset_name": "小游戏转化追踪",
    "mini_game_id": "<GAME_ID>"
  }'
```

#### 3.2.2 配置事件

在事件管理平台中，为已创建的资产配置需要追踪的事件类型：

| 事件类型 | event_type | 说明 |
|----------|-----------|------|
| 激活 | `activate` | 用户首次打开小游戏 |
| 注册 | `register` | 用户完成注册 |
| 付费 | `pay` | 用户产生付费行为 |
| 关键行为 | `game_addiction` | 自定义关键行为（如达到某关卡、在线时长等） |
| 次留 | `retention` | 次日留存 |
| 创角 | `create_role` | 创建游戏角色 |

#### 3.2.3 回传配置方式

**方式一：API 服务端回传**

```bash
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/track/active/' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "activate",
    "context": {
      "ad_id": "<AD_ID>",
      "creative_id": "<CREATIVE_ID>"
    },
    "timestamp": 1746000000,
    "media": "oceanengine"
  }'
```

**方式二：带属性值回传（推荐用于付费等有价值事件）**

```bash
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/track/active/' \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "pay",
    "event_param": {
      "pay_amount": 680,
      "pay_channel": "wechat"
    },
    "context": {
      "ad_id": "<AD_ID>"
    },
    "timestamp": 1746000000,
    "media": "oceanengine"
  }'
```

**方式三：回调 URL 回传（url + token 方式）**

通过巨量引擎后台获取的 `url` + `token`，在第三方归因平台（如热力引擎/SolarEngine）中配置回调：

```
回传地址格式：{url}?event_type=activate&timestamp=1746000000&...&token={token}
```

> 该方式通常配合第三方归因平台使用，第三方平台负责采集事件数据并回调到巨量引擎。

### 3.3 小游戏 SDK 端回传

抖音小游戏还可通过客户端 SDK 直接上报关键行为：

```javascript
// 抖音小游戏 SDK 调用示例
tt.reportEvent({
  event: 'pay',
  params: {
    pay_amount: 680,
    order_id: 'order_123456'
  }
});
```

### 3.4 小游戏路径参数与渠道标识

广告点击进入小游戏时，URL 中需携带以下参数用于归因：

```
?advertPlatform=oceanengine&gameType=wxminigame&mainChannel=100708&secondChannel=100709
```

| 参数 | 说明 |
|------|------|
| `advertPlatform` | 媒体平台标识（oceanengine / tencent） |
| `gameType` | 游戏类型（wxminigame / dyminigame） |
| `mainChannel` | 主渠道标识 |
| `secondChannel` | 子渠道标识 |

### 3.5 ROI 出价模式的回传重点

巨量引擎的 ROI 出价模式（IAP 小游戏推荐）对回传数据要求更高：

| 配置项 | 说明 |
|--------|------|
| **付费回传** | 必须回传 `pay` 事件，带 `pay_amount` 属性值 |
| **回传时效** | 付费事件建议实时回传（5分钟内），越快越好 |
| **金额精度** | 单位为分（与创建广告时一致），不可为0 |
| **归因窗口** | 建议 7 天点击归因窗口 |
| **数据量** | 日均转化 > 50 条，模型才能有效学习 |

---

## 四、两平台归因与回传对比

| 维度 | 腾讯广告（微信小游戏） | 巨量引擎（抖音小游戏） |
|------|----------------------|----------------------|
| **归因口径** | 注册归因（微信）/ 点击归因（QQ） | 点击归因 |
| **核心标识** | cb (callback) / click_id + openid | callback / url+token / Click ID |
| **回传前提** | DataNexus 授权微信 AppID | 事件管理平台创建资产+配置事件 |
| **回传接口** | `tracking.e.qq.com/conv` (cb) / `user_actions/add` (数据源) | `track/active` / `event_manager` API |
| **鉴权方式** | access-token + timestamp + nonce (2025Q3起强制) | Access-Token Header |
| **小游戏用户标识** | wechat_app_id + wechat_openid | 小游戏内用户标识 / 设备标识 |
| **去重** | outer_action_id 三字段去重 | event_type + timestamp 去重 |
| **付费回传** | action_type=PURCHASE, value=金额(分) | event_type=pay, pay_amount(分) |
| **ROI出价支持** | oCPM + 次留优化 | oCPM + ROI 双目标出价 |
| **SDK支持** | 微信小游戏 SDK 可自动上报部分行为 | 抖音 SDK tt.reportEvent |
| **推荐回传方式** | Callback 鉴权上报（新版） | API 服务端回传 + 事件管理 |

---

## 五、回传数据质量优化建议

### 5.1 数据准确性

| 问题 | 解决方案 |
|------|---------|
| 重复上报 | 使用 outer_action_id（腾讯）或保证 event 唯一性（巨量） |
| 归因失败 | 确保 AppID 授权正确（腾讯）、url/token 配置正确（巨量） |
| 时间偏差 | action_time / timestamp 使用转化发生时刻，非上报时刻 |
| 金额错误 | 统一使用"分"为单位，避免浮点误差 |

### 5.2 回传时效

| 场景 | 建议时效 |
|------|---------|
| 激活/注册 | 5 分钟内 |
| 付费 | 实时（1 分钟内最优） |
| 创角/次留 | 30 分钟内 |
| 批量补传 | 不超过 7 天 |

### 5.3 oCPM/ROI 模型优化要点

1. **数据量**：日均转化 ≥ 50 条，模型稳定学习需要
2. **数据完整**：付费事件必回传金额，ROI 出价依赖金额数据
3. **数据及时**：实时回传 > 延迟回传，模型响应更快
4. **正向负向都要回传**：只回传付费不回传激活 → 模型学习偏差
5. **冷启动期**：前 3-5 天是模型学习关键期，确保回传链路畅通

---

## 六、常见问题

### Q1: 回传了数据但报表看不到？
- 检查归因标识（cb/click_id/url+token）是否正确获取
- 腾讯广告：检查 AppID 是否授权、openid 是否匹配
- 巨量引擎：检查事件资产是否创建并生效（约 15 分钟）
- 数据延迟：报表通常 T+1 生效，实时可能有延迟

### Q2: 多个投放账户如何回传？
- 腾讯广告：1 个 access-token 可供多个投放账户使用；1 个上报账户可归因至多个投放账户
- 巨量引擎：任一账户下获取的 url+token 即可回传，多账户无需重复获取

### Q3: 回传金额为何与实际收入不一致？
- 检查单位：腾讯广告为"分"，巨量引擎也建议用"分"
- 检查时机：回传 time 是转化时间，非上报时间
- 检查去重：是否因 outer_action_id 重复被过滤

### Q4: 腾讯广告 2025 年鉴权升级后如何迁移？
- 原 HTTP 上报 → 切换 HTTPS + access-token + timestamp + nonce
- CALLBACK URL 会在 2025Q3 自动切换为鉴权版本
- 参考文档：[DataNexus 升级指引](https://datanexus.qq.com/doc/develop/guider/interface/conversion/trackingcgi_to_mktapi)

### Q5: 巨量引擎 ROI 出价回传有何特殊要求？
- 必须回传 pay 事件并附带 pay_amount
- 金额不为 0，单位统一
- 建议实时回传（1-5 分钟内）
- 日均转化 ≥ 50 条保障模型学习

---

## 七、关键文档索引

### 官方文档
- [腾讯广告小游戏转化数据 API 自归因](https://developers.e.qq.com/docs/guide/conversion/new_version/Mini_Game_api)
- [DataNexus 小游戏转化数据上报](https://datanexus.qq.com/doc/develop/guider/interface/conversion/trackingcgi_api_minigame)
- [腾讯广告转化数据上报升级指引（2025鉴权升级）](https://datanexus.qq.com/doc/develop/guider/interface/conversion/trackingcgi_to_mktapi)
- [巨量引擎事件管理平台](https://open.oceanengine.com/)
- [巨量引擎开放平台 API - event_manager](https://open.oceanengine.com/docs/)
- [微信小游戏广告数据监控指引](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/ad/monitoring.html)

### 第三方归因平台
- [热力引擎 (SolarEngine) 巨量引擎配置](https://help.solar-engine.com/cn/docs/ju-liang-yin-qing)
- [TrackingIO 巨量引擎配置](http://docs.trackingio.com/巨量引擎(小程序).html)