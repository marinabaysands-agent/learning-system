# Learning System — SPEC v3（周历 + Streak 版）

## 设计方向

从"安静书房"进化为"有节奏感的学习日历"。核心隐喻从"翻书"变为"每天一页日历"。保留温暖质感，增加 Duolingo 式的微激励。

**一句话：** 每天读一篇，像翻日历一样自然。

---

## PAGE 1 — 首页（/）

### 结构（自上而下）

```
┌─────────────────────────────────────┐
│  🔥 连续阅读 N 天        streak badge│
├─────────────────────────────────────┤
│  [今日阅读 Hero Card]               │
│   标题 / 作者 / 进度 XX%            │
│   顶部渐变色条（accent → 透明）      │
│   CTA: 继续阅读 →                   │
├─────────────────────────────────────┤
│  接下来                             │
│   5/9  文章标题A                    │
│   5/10 文章标题B                    │
│   5/11 文章标题C                    │
├─────────────────────────────────────┤
│  [Mini 月历]                        │
│   已读日 = 实心圆 / 未来 = 空       │
├─────────────────────────────────────┤
│  [ 首页 | 内容库 | 笔记 | 主题 ]    │  ← tab bar
└─────────────────────────────────────┘
```

### Streak Badge

- 位置：首页顶部右侧
- 样式：🔥 + 数字 + "天"，pill 形状
- 逻辑：连续每天至少阅读 1 篇（进度 > 0% 且当天有新增进度）
- **Corner cases:**
  - streak = 0 → 不显示 badge（不要打击用户）
  - streak = 1 → 显示"🔥 1 天"（即使只有一天也鼓励）
  - 中断后 → badge 消失，重新从 1 开始计
  - "阅读"的定义 = 当天该文章的 scrollProgress 比前一天增加了（防止打开就关算阅读）
  - 时区 = Asia/Shanghai，以 0:00 为日切
  - 数据来源：KV 存储 `streak:current` + `streak:lastReadDate`

### 今日阅读 Hero Card

- 内容：当前正在读的文章（进度 > 0% 且 < 100% 的最近一篇）
- 顶部：3px 渐变色条（var(--accent) → transparent，从左到右按进度比例填充）
- 信息：标题（衬线，1.25rem）/ 作者 · 来源 / 进度百分比
- CTA：底部"继续阅读 →"链接
- **Corner cases:**
  - 没有进行中的文章（全部 100% 或全部 0%）→ 显示"推荐阅读"卡片（从 backlog 随机取一篇）
  - 多篇进行中 → 取 lastReadAt 最近的那篇
  - 进度 100% → 不在 hero 出现，进入已读状态

### 接下来（时间线）

- 显示未来 3-5 天的阅读计划
- 每行：日期（M/D 格式）+ 文章标题
- 数据来源：`schedule` 字段（后面定义）
- **Corner cases:**
  - 没有排期 → 显示"还没安排接下来的阅读"+ CTA 去内容库挑选
  - 排期的文章被删了 → 跳过该天，不显示空行
  - 今天的排期已读完 → 该行显示 ✓ 状态

### Mini 月历

- 当月日历网格（7列，周一开始）
- 已读日 = 实心小圆点（accent 色）
- 今天 = 圆点 + 外圈
- 未来 = 无标记
- 没有阅读的过去日子 = 无标记（不惩罚）
- **Corner cases:**
  - 月初只有 1-2 天数据 → 正常显示，大部分格子空白（这样反而有动力填满）
  - 跨月 → 只显示当月
  - 点击日期 → 暂无交互（v3 不做）

### Tab Bar

- 固定底部（移动端）/ 固定底部区域（桌面）
- 4 个 tab：首页 / 内容库 / 笔记 / 主题
- 当前 tab 高亮（accent 色文字 + 底部 2px 线）
- 图标 + 文字双行

---

## PAGE 2 — 内容库（/library/）— 周历视图

### 核心概念

每天一行，像日历/agenda 一样浏览内容。不是传统的卡片网格。

### 结构

```
┌─────────────────────────────────────┐
│  内容库           本周 5/5 — 5/11    │
│                   < 上周 | 下周 >    │
├─────────────────────────────────────┤
│  周一 5/5   [文章标题]    ✓ 已读     │
│  周二 5/6   [文章标题]    ✓ 已读     │
│  周三 5/7   [文章标题]    72%        │  ← 今天高亮
│  周四 5/8   [文章标题]    ○          │
│  周五 5/9   [文章标题]    ○          │
│  周六 5/10  [文章标题]    ○          │
│  周日 5/11  休息日 ☕                 │
├─────────────────────────────────────┤
│  [ tab bar ]                        │
└─────────────────────────────────────┘
```

### 行样式——三态

| 状态 | 左侧 | 中间 | 右侧 | 行样式 |
|------|------|------|------|--------|
| 已读 | 日期（灰） | 标题（灰，删除线？不，半透明） | ✓ 绿色实心圆 | opacity: 0.6 |
| 进行中（今天） | 日期（黑） | 标题（黑，加粗） | 进度百分比 | 暖色背景高亮行（accent 5% 透明度） |
| 未来 | 日期（灰） | 标题（正常色） | ○ 空心灰色圆圈 | 默认样式 |

### 周日休息日

- 固定为"休息日 ☕"文案
- 不排内容
- 样式：斜体，text3 颜色
- **Corner case:** 如果用户就是想周日也读 → v3 不支持自定义，hardcode 周日休息

### 周切换

- 显示"本周 M/D — M/D"
- 左右箭头切换上/下周
- **Corner cases:**
  - 最早的周 = 第一篇文章的日期所在周（之前的周不可切换）
  - 最远的未来 = 当前周 + 4 周（不排太远）
  - 某天没有排期 → 该行显示"—"或"空闲"
  - 一天排了 2 篇 → 该行显示第一篇，第二篇折叠（点击展开）——或者 v3 简化为一天一篇

### 排期机制（Schedule）

**数据模型：**
```json
{
  "schedule": [
    { "date": "2026-05-05", "articleId": "cat-wu-anthropic" },
    { "date": "2026-05-06", "articleId": "boris-cherny-claude-code" },
    ...
  ]
}
```

**存储：** KV key = `schedule`，value = JSON array

**排期规则：**
- Sands（我）负责排期，通过 API 写入
- 一天一篇，周日空
- 用户可以提前读完（不锁定日期）
- 读完一篇自动进入下一篇（不等日期）

**Corner cases:**
- 文章比天数多 → 排不完的进 backlog
- 文章比天数少 → 某些天为空
- 用户跳着读 → 没关系，周历只是建议不是强制
- 重新排期 → 覆盖旧 schedule

---

## PAGE 3 — 文章页（/articles/xxx.html）

### 结构变更（相对 v2）

1. **顶部渐变进度条** — 页面最顶部 3px 固定条，从左到右按滚动进度填充，颜色 = accent 渐变
2. **TLDR 区域色彩统一** — 去掉之前的绿色系，改为暖色系：
   - 背景：oklch(96% 0.02 30)（极淡暖粉）
   - 边框左侧：4px accent 色
   - 文字：正常 text 色
3. **马克笔式划线** — 重点改动 ⬇️

### 马克笔式划线

**视觉效果：** 不是整块背景色，而是文字下方 40% 有半透明颜色——模拟真实马克笔在纸上的效果。

**CSS 实现：**
```css
mark.highlight {
  background: none;
  background-image: linear-gradient(
    to top,
    oklch(85% 0.08 80 / 0.5) 0%,    /* 底部 40% 有颜色 */
    oklch(85% 0.08 80 / 0.5) 40%,
    transparent 40%
  );
  padding: 0 2px;
  border-radius: 0;
}
```

**颜色方案（马克笔色）：**
| 名称 | 色值（底部渐变） | 用途 |
|------|-----------------|------|
| 黄色（默认） | oklch(90% 0.10 90 / 0.5) | 普通划线 |
| 粉色 | oklch(88% 0.08 10 / 0.45) | 重要观点 |
| 绿色 | oklch(88% 0.06 150 / 0.4) | 待实践 |
| 蓝色 | oklch(88% 0.06 240 / 0.4) | 引用/数据 |

**Corner cases:**
- 划线跨行 → gradient 每行独立渲染（因为是 inline 元素，浏览器自动处理）
- 划线重叠 → 后划的在上面（z-index 自然叠加）
- 划线内有 `<em>` / `<strong>` → 需要确保 mark 包裹外层（XPath 方案）
- 暗色模式（暂不支持）→ 不做，v3 只有亮色
- 打印 → gradient 在打印时可能不显示，加 `@media print { mark { background: rgba(255,230,0,0.3) !important; } }`

### 其余文章页功能

- 保持 v2 的：章节结构、目录跳转、阅读进度保存、批注
- 进度条新增动画：滚动时平滑过渡（transition: width 0.1s）

---

## PAGE 4 — 笔记（/notes/）

与 v2 基本一致，微调：

- 划线样式改为马克笔式（与文章页统一）
- 按文章分组
- 每条划线可展开看上下文（前后各 1 句）
- **Corner case:** 划线被删了但笔记还在 → 显示"[原文已删除]" + 笔记内容

---

## PAGE 5 — 主题（/topics/）

与 v2 一致：标签云 + 点击展开该标签下的文章列表。

---

## 数据模型变更

### 新增 KV keys

| Key | 类型 | 说明 |
|-----|------|------|
| `streak:current` | number | 当前连续天数 |
| `streak:lastReadDate` | string (YYYY-MM-DD) | 最后有效阅读日 |
| `streak:history` | JSON array | 每日阅读记录 [{date, articleId, progressDelta}] |
| `schedule` | JSON array | 排期 [{date, articleId}] |
| `readDays` | JSON array | 所有有阅读的日期列表（用于月历渲染） |

### Streak 计算逻辑

```
每次保存进度时：
1. 计算 progressDelta = newProgress - oldProgress
2. 如果 delta > 0:
   a. today = 今天日期 (Asia/Shanghai)
   b. 如果 lastReadDate == today → 不变
   c. 如果 lastReadDate == yesterday → streak += 1, lastReadDate = today
   d. 如果 lastReadDate < yesterday → streak = 1, lastReadDate = today
   e. 把 today 加入 readDays（去重）
```

**Corner cases:**
- 午夜前后连续阅读 → 以保存进度的时刻判定（不是打开文章的时刻）
- 同一天读多篇 → streak 只 +0（已经算过了）
- 清除浏览器缓存 → streak 存服务端 KV，不受影响
- API 挂了 → 前端显示上次缓存的 streak（localStorage fallback）
- 第一次使用 → streak = 0，不显示 badge

---

## API 变更

### 新增 endpoints

```
GET  /api/streak          → { current, lastReadDate, readDays }
POST /api/streak/update   → 自动由 progress 保存触发（不需要单独调）

GET  /api/schedule        → [{ date, articleId, article: {...} }]
POST /api/schedule        → body: [{ date, articleId }]  （Sands 写入）
```

### 修改 endpoints

```
POST /api/progress/:articleId  → 新增逻辑：保存后触发 streak 更新
```

---

## 响应式适配

| 断点 | 布局变化 |
|------|---------|
| < 768px（手机） | 单列，tab bar 固定底部，月历缩小为点阵 |
| 768-1400px（平板/笔记本） | 单列但更宽，tab bar 底部 |
| > 1400px（大屏） | 首页可以左右双栏（hero + 时间线 | 月历） |

---

## 交互细节

### 进度条（文章页顶部）

- 固定在 viewport 顶部（position: fixed; top: 0）
- 高度 3px
- 背景：transparent
- 填充：线性渐变 accent → lighter accent
- 动画：width transition 0.15s ease-out
- 100% 时：短暂闪烁后淡出（opacity 0，500ms 后）

### 周历行点击

- 点击整行 → 跳转到该文章
- 已读行点击 → 也能跳转（复习）
- 休息日行 → 不可点击，cursor: default

### Streak 动画

- 数字变化时：数字短暂放大 1.2x + bounce 回来（scale animation 300ms）
- 新 streak 开始（从 0 → 1）：🔥 emoji 有个小抖动动画

---

## 不做的事（v3 scope out）

- ❌ 暗色模式
- ❌ 用户自定义排期（Sands 代排）
- ❌ 月历点击交互
- ❌ 社交功能（分享、排行榜）
- ❌ 通知推送（飞书 cron 已有）
- ❌ 多设备同步冲突处理（KV 是 last-write-wins）
- ❌ 一天多篇的复杂排期

---

## 实现分批

### Batch 1 — 基础结构 + 周历
- [ ] 首页新布局（hero card + 时间线 + 月历 + tab bar）
- [ ] 内容库改为周历视图
- [ ] Schedule API（GET/POST）
- [ ] Tab bar 导航

### Batch 2 — Streak + 进度条
- [ ] Streak 计算逻辑（后端）
- [ ] Streak badge UI
- [ ] 文章页顶部渐变进度条
- [ ] 月历数据填充

### Batch 3 — 马克笔划线 + 视觉打磨
- [ ] 马克笔式 highlight CSS
- [ ] TLDR 区域暖色统一
- [ ] 微动画（streak bounce、进度条淡出）
- [ ] Corner case 处理 + 回归测试

---

## 设计 Token 变更（相对 DESIGN-v2）

```css
/* 新增 */
--highlight-yellow: oklch(90% 0.10 90 / 0.5);
--highlight-pink:   oklch(88% 0.08 10 / 0.45);
--highlight-green:  oklch(88% 0.06 150 / 0.4);
--highlight-blue:   oklch(88% 0.06 240 / 0.4);
--streak-fire:      oklch(65% 0.20 30);   /* 🔥 badge 背景 */
--today-bg:         oklch(96% 0.02 30);    /* 今日行高亮背景 */
--progress-bar:     linear-gradient(90deg, var(--accent), oklch(60% 0.08 40));
```

---

*Updated: 2026-05-08 by Sands*
