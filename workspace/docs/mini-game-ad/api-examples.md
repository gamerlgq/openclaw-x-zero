# API 实际调用示例：Token 获取 & 广告创建

> 覆盖腾讯广告（微信小游戏）和巨量引擎（抖音小游戏）两大平台
> 最后更新: 2026-04-29

---

## 一、腾讯广告 Marketing API（微信小游戏）

### 1.1 开发者注册 & 应用创建

1. 进入 https://developers.e.qq.com 注册开发者（关联QQ号）
2. 完善资料 → 通过手机验证
3. 创建应用：
   - **私有应用**: 注册QQ同时是广告主/代理商开户QQ → 自动审核通过
   - **第三方应用**: 需2-3工作日审核，支持OAuth2.0管理多广告账号

### 1.2 获取 Access Token

#### 方式A: 私有应用（直接获取）

在应用详情界面 → 选择账户身份 → 点击"获取或重置" → 获取 access_token 和 refresh_token

- token 生成后 10 分钟生效
- 仅展示一次，需妥善保存
- 重置后旧 token 立即失效

#### 方式B: 第三方应用（OAuth 2.0）

**Step 1: 引导授权，获取 Authorization Code**

```
https://developers.e.qq.com/oauth/authorize?
  client_id=<APP_ID>
  &redirect_uri=https%3a%2f%2fwww.example.com
  &state=xyz
  &scope=ads_management
  &account_type=ACCOUNT_TYPE_QQ
```

用户授权后，系统跳转回调地址并附带 `authorization_code`

**Step 2: 用 Authorization Code 换取 Access Token**

```bash
curl -G 'https://api.e.qq.com/oauth/token' \
  -d 'client_id=<CLIENT_ID>' \
  -d 'client_secret=<CLIENT_SECRET>' \
  -d 'grant_type=authorization_code' \
  -d 'authorization_code=<AUTHORIZATION_CODE>' \
  -d 'redirect_uri=https://www.example.com'
```

返回:
```json
{
  "code": 0,
  "data": {
    "access_token": "228bd56b7ee039540953352f766b40d31651487e",
    "refresh_token": "854e744a1f4c6fc20f498e366b9aabd2c4b971fd",
    "access_token_expires_in": 86400,
    "refresh_token_expires_in": 2592000
  }
}
```

**Step 3: 刷新 Access Token**

```bash
curl -G 'https://api.e.qq.com/oauth/token' \
  -d 'client_id=<CLIENT_ID>' \
  -d 'client_secret=<CLIENT_SECRET>' \
  -d 'grant_type=refresh_token' \
  -d 'refresh_token=<REFRESH_TOKEN>'
```

> 每次刷新 access_token 时，refresh_token 自动续期。
> refresh_token 失效后需重新走 OAuth 2.0 流程。

**Token 有效期**:
- access_token: 默认 24 小时
- refresh_token: 默认 30 天

### 1.3 创建推广计划（Campaign）

```bash
curl 'https://api.e.qq.com/v1.1/campaigns/add?access_token=<ACCESS_TOKEN>&timestamp=<TIMESTAMP>&nonce=<NONCE>' \
  -d 'account_id=<ACCOUNT_ID>' \
  -d 'campaign_name=小游戏推广计划' \
  -d 'campaign_type=CAMPAIGN_TYPE_NORMAL' \
  -d 'promoted_object_type=PROMOTED_OBJECT_TYPE_MINI_GAME_WECHAT' \
  -d 'daily_budget=50000' \
  -d 'configured_status=AD_STATUS_SUSPEND' \
  -d 'speed_mode=SPEED_MODE_STANDARD'
```

**关键参数**:
- `promoted_object_type=PROMOTED_OBJECT_TYPE_MINI_GAME_WECHAT` → 微信小游戏
- `daily_budget`: 单位为分，50000 = 500元人民币
- `speed_mode`: `SPEED_MODE_STANDARD`(标准投放) / `SPEED_MODE_FAST`(加速投放)

返回:
```json
{
  "code": 0,
  "data": {
    "campaign_id": "<CAMPAIGN_ID>"
  }
}
```

### 1.4 创建广告组（AdGroup）

```bash
curl 'https://api.e.qq.com/v1.1/adgroups/add?access_token=<ACCESS_TOKEN>&timestamp=<TIMESTAMP>&nonce=<NONCE>' \
  -d 'account_id=<ACCOUNT_ID>' \
  -d 'campaign_id=<CAMPAIGN_ID>' \
  -d 'adgroup_name=小游戏广告组-男性18-35' \
  -d 'promoted_object_type=PROMOTED_OBJECT_TYPE_MINI_GAME_WECHAT' \
  -d 'begin_date=2026-05-01' \
  -d 'end_date=2026-05-31' \
  -d 'billing_event=BILLINGEVENT_CPM' \
  -d 'bid_amount=200' \
  -d 'optimization_goal=OPTIMIZATIONGOAL_APP_ACTIVATE' \
  -d 'site_set=["SITE_SET_WECHAT"]' \
  -d 'daily_budget=10000' \
  -d 'targeting_id=<TARGETING_ID>' \
  -d 'configured_status=AD_STATUS_NORMAL'
```

**关键参数**:
- `promoted_object_type=PROMOTED_OBJECT_TYPE_MINI_GAME_WECHAT`
- `billing_event`: 计费方式
  - `BILLINGEVENT_CPM` → CPM 千次展示
  - `BILLINGEVENT_CLICK` → CPC 点击
  - `BILLINGEVENT_OCPM` → oCPM 优化千次展示（推荐）
- `optimization_goal`: 优化目标
  - `OPTIMIZATIONGOAL_APP_ACTIVATE` → 激活
  - `OPTIMIZATIONGOAL_APP_PURCHASE` → 付费
  - `OPTIMIZATIONGOAL_CLICK` → 点击
- `site_set`: 广告版位
  - `SITE_SET_WECHAT` → 微信流量
  - `SITE_SET_MOMENTS` → 朋友圈
  - `SITE_SET_QQ_MUSIC` → QQ音乐
- `targeting_id`: 定向包ID（需提前创建）

### 1.5 创建广告创意

```bash
curl 'https://api.e.qq.com/v1.1/adcreatives/add?access_token=<ACCESS_TOKEN>&timestamp=<TIMESTAMP>&nonce=<NONCE>' \
  -d 'account_id=<ACCOUNT_ID>' \
  -d 'campaign_id=<CAMPAIGN_ID>' \
  -d 'adgroup_id=<ADGROUP_ID>' \
  -d 'adcreative_name=小游戏创意-视频A' \
  -d 'adcreative_template_id=<TEMPLATE_ID>' \
  -d 'adcreative_elements={"image_list":["<IMAGE_ID>"],"title":"快来玩小游戏"}' \
  -d 'page_type=PAGE_TYPE_MINI_GAME_WECHAT' \
  -d 'link_name_type=ENTER_MINI_GAME'
```

**关键参数**:
- `page_type=PAGE_TYPE_MINI_GAME_WECHAT` → 点击进入小游戏
- `link_name_type=ENTER_MINI_GAME` → 朋友圈"查看详情"文字链
- `adcreative_template_id`: 通过 `adcreative_templates/get` 查询可用模板

### 1.6 全局参数说明

每个 API 请求必须包含:
- `access_token`: 授权令牌
- `timestamp`: 当前秒级时间戳（允许误差 300 秒）
- `nonce`: 随机字串（≤32字符，全局唯一）

请求头支持 `X-Request-Id` 用于幂等性保证（重复创建不会产生新资源）

---

## 二、巨量引擎 Marketing API（抖音小游戏）

### 2.1 开发者注册 & 应用创建

1. 进入 https://open.oceanengine.com 注册开发者
2. 创建应用 → 获取 `app_id` 和 `secret`
3. 申请权限（需审核）
4. 可用 SDK:
   - Go: https://github.com/oceanengine/ad_open_sdk_go (53 stars)
   - Java: https://github.com/oceanengine/ad_open_sdk_java (38 stars, 官方)
   - PHP: https://github.com/westng/oceanengine-sdk-php

### 2.2 获取 Access Token

**Step 1: 引导授权**

```
https://ad.oceanengine.com/openapi/audit/oauth.html?
  app_id=<APP_ID>
  &redirect_uri=https://www.example.com/callback
  &state=xyz
  &material_auth=1
```

**Step 2: 用 Authorization Code 换取 Access Token**

```bash
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/oauth2/app_access_token/' \
  -H 'Content-Type: application/json' \
  -d '{
    "app_id": "<APP_ID>",
    "secret": "<SECRET>",
    "grant_type": "auth_code",
    "auth_code": "<AUTH_CODE>"
  }'
```

返回:
```json
{
  "code": 0,
  "data": {
    "access_token": "xxx",
    "refresh_token": "xxx",
    "expires_in": 86400,
    "refresh_token_expires_in": 2592000
  }
}
```

**Step 3: 刷新 Token**

```bash
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/oauth2/refresh_token/' \
  -H 'Content-Type: application/json' \
  -d '{
    "app_id": "<APP_ID>",
    "secret": "<SECRET>",
    "grant_type": "refresh_token",
    "refresh_token": "<REFRESH_TOKEN>"
  }'
```

**获取已授权账户**:
```bash
curl 'https://ad.oceanengine.com/openapi/v1.0/oauth2/advertiser/get/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -d 'app_id=<APP_ID>&secret=<SECRET>'
```

### 2.3 创建广告组（Campaign）

```bash
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/campaign/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "campaign_name": "抖音小游戏推广",
    "budget_mode": "BUDGET_MODE_DAY",
    "budget": 50000,
    "operation": "CREATE",
    "campaign_type": "CAMPAIGN_TYPE_NORMAL"
  }'
```

### 2.4 创建广告计划（Ad）

```bash
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/ad/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "campaign_id": <CAMPAIGN_ID>,
    "ad_name": "小游戏计划-激活",
    "budget_mode": "BUDGET_MODE_DAY",
    "budget": 10000,
    "delivery_mode": "DELIVERY_MODE_MANUAL",
    "pricing": "PRICING_OCPM",
    "cpa_bid": 500,
    "optimization_goal": "OPTIMIZATIONGOAL_APP_ACTIVATE",
    "billing_event": "BILLINGEVENT_IMPRESSION",
    "start_time": "2026-05-01",
    "end_time": "2026-05-31",
    "targeting": {
      "age": [{"min": 18, "max": 35}],
      "gender": "GENDER_MALE",
      "location": {"regions": []}
    },
    "creative_ids": [<CREATIVE_ID>]
  }'
```

**关键参数**:
- `pricing`: 出价方式
  - `PRICING_CPC` → CPC
  - `PRICING_CPM` → CPM
  - `PRICING_OCPM` → oCPM（推荐）
  - `PRICING_ROI` → ROI 出价（IAP 小游戏推荐）
- `optimization_goal`: 优化目标
  - `OPTIMIZATIONGOAL_APP_ACTIVATE` → 激活
  - `OPTIMIZATIONGOAL_APP_PURCHASE` → 付费
  - `OPTIMIZATIONGOAL_LIVE` → 留存

### 2.5 巨量引擎 V3 体验版 API（推荐）

新版投放层级: **项目(Project) → 广告(Promotion)**

```bash
# 创建项目
curl -X POST 'https://ad.oceanengine.com/openapi/v3.0/project/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "project_name": "小游戏项目",
    "budget_mode": "BUDGET_MODE_DAY",
    "budget": 50000,
    "ro_i_goal": 0.0
  }'

# 创建广告
curl -X POST 'https://ad.oceanengine.com/openapi/v3.0/promotion/create/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "advertiser_id": <ADVERTISER_ID>,
    "project_id": <PROJECT_ID>,
    "promotion_name": "小游戏广告",
    "promotion_type": "PROMOTION_TYPE_NORMAL",
    "pricing": "PRICING_OCPM",
    "optimization_goal": "OPTIMIZATIONGOAL_APP_ACTIVATE",
    "cpa_bid": 500
  }'
```

### 2.6 添加小游戏资产

```bash
# 查询应用/游戏信息
curl 'https://ad.oceanengine.com/openapi/v1.0/tools/app_management/app/get/' \
  -H 'Access-Token: <ACCESS_TOKEN>' \
  -d 'advertiser_id=<ADVERTISER_ID>&app_type=MINI_GAME'
```

### 2.7 事件管理 & 转化回传

```bash
# 获取已创建资产列表
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

# 转化回传
curl -X POST 'https://ad.oceanengine.com/openapi/v1.0/track/active/' \
  -d '{
    "event_type": "activate",
    "context": {"ad_id": "<AD_ID>"},
    "timestamp": 1714406400
  }'
```

---

## 三、两平台 API 调用对比

| 维度 | 腾讯广告 | 巨量引擎 |
|------|---------|---------|
| API Base URL | `https://api.e.qq.com/v1.1/` | `https://ad.oceanengine.com/openapi/v1.0/` |
| 认证方式 | URL 参数 `access_token` | Header `Access-Token` |
| 全局参数 | access_token + timestamp + nonce | Access-Token header |
| 幂等性 | X-Request-Id header | - |
| 小游戏推广目标 | `PROMOTED_OBJECT_TYPE_MINI_GAME_WECHAT` | asset_type=MINI_GAME |
| 落地页类型 | `PAGE_TYPE_MINI_GAME_WECHAT` | - |
| 推荐出价 | oCPM | oCPM / ROI |
| V3 新版 | 新投放(广告-创意2层) | V3(项目-广告2层) |
| 数据上报 | user_actions/add | track/active 或 event_manager |

---

## 四、关键注意事项

1. **Token 安全**: 大量使用错误 token 可能导致 IP 被封停
2. **频率限制**: 每个接口有调用频次和配额限制，需关注返回的 rate limit 信息
3. **预算单位**: 腾讯广告为"分"，巨量引擎为"厘"（具体看接口文档）
4. **小游戏 ID**: 微信小游戏为 `wx_xxx` 格式，抖音小游戏为纯数字
5. **审核**: 素材和广告计划均需审核，腾讯广告通常 1-2 小时，巨量引擎审核约 1 小时
