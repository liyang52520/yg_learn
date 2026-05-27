# 学习刷题平台 — 设计文档

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14+ (App Router) |
| 语言 | TypeScript |
| 数据库 | SQLite |
| ORM | Prisma |
| 样式 | Tailwind CSS |
| UI 组件 | shadcn/ui (Radix) |
| 富文本 | TipTap (ProseMirror) |
| 图标 | lucide-react |
| 图表 | recharts |
| 认证 | next-auth (Credentials provider) |
| 密码 | bcryptjs |
| 校验 | zod |
| 部署 | 阿里云 ECS (Docker / PM2) |

## 数据库模型 (Prisma)

### User
- id (Int, PK, autoincrement)
- email (String, unique)
- passwordHash (String)
- name (String)
- role (enum: USER, ADMIN)
- createdAt / updatedAt

### ArticleCategory
- id (Int, PK)
- name (String)
- slug (String, unique)
- description (String?)
- order (Int, default 0)
- createdAt / updatedAt
- Relation: articles[]

### Article
- id (Int, PK)
- title (String)
- content (String) — 富文本 HTML
- summary (String?)
- categoryId (Int, FK → ArticleCategory)
- createdAt / updatedAt
- Relation: category, highlights[]

### ArticleHighlight
- id (Int, PK)
- startOffset (Int)
- endOffset (Int)
- text (String) — 被选中的文本
- note (String?) — 用户写的笔记
- userId (Int, FK → User)
- articleId (Int, FK → Article)
- createdAt / updatedAt

### QuestionCategory
- id (Int, PK)
- name (String)
- slug (String, unique)
- description (String?)
- order (Int, default 0)
- createdAt / updatedAt
- Relation: questions[]

### Question
- id (Int, PK)
- title (String)
- content (String) — 题目描述（富文本）
- answer (String) — 参考答案（富文本）
- categoryId (Int, FK → QuestionCategory)
- createdAt / updatedAt
- Relation: category, progressRecords[], bookmarks[], notes[]

### UserQuestionProgress (SM-2 复习状态)
- id (Int, PK)
- userId (Int, FK → User)
- questionId (Int, FK → Question)
- ease (Float, default 2.5)
- interval (Int, default 0) — 天
- repetitions (Int, default 0)
- nextReviewDate (DateTime)
- lastScore (Int?) — 最后一次评分 0-5
- createdAt / updatedAt
- **unique** constraint: (userId, questionId)

### QuestionNote
- id (Int, PK)
- content (String)
- userId (Int, FK → User)
- questionId (Int, FK → Question)
- createdAt / updatedAt

### Bookmark
- id (Int, PK)
- userId (Int, FK → User)
- questionId (Int, FK → Question)
- createdAt
- **unique** constraint: (userId, questionId)

### DailyRecord
- id (Int, PK)
- userId (Int, FK → User)
- date (DateTime) — 日期（年月日）
- questionsLearned (Int, default 0) — 当日新学题数（首次答该题）
- questionsReviewed (Int, default 0) — 当日复习题数（该题已有历史记录）
- correctCount (Int, default 0) — 当日评分 >= 3 的题数（自评为正确）
- createdAt
- **unique** constraint: (userId, date)

## 页面路由

```
/(auth)
├── /login
├── /register

/(main)
├── / (仪表盘) — 今日概览、待复习提醒
├── /learn — 学习模块
│   ├── 分类侧栏 + 文章列表
│   └── /articles/[slug] — 文章阅读 + 划线笔记
├── /quiz — 刷题模块
│   ├── /learn — 今日学习（选分类 + 选数量 → 抽题 → 作答）
│   ├── /review — 复习模式（SM-2 推送）
│   ├── /bookmarks — 收藏列表
│   ├── /categories — 按分类刷题
│   └── [id] — 具体答题页
└── /stats — 统计与打卡
    └── 打卡日历 / 学习统计 / 复习统计

/admin
├── / — 管理后台仪表盘
├── /users — 用户管理列表
├── /articles/categories — 文章分类管理
├── /articles/[id] — 文章编辑（TipTap 富文本）
├── /questions/categories — 题目分类管理
└── /questions/[id] — 题目编辑
```

## UI 布局

```
┌──────────────────────────────────────────────────────┐
│  Logo  学习  刷题                 [用户头像 ▼]        │
│                                  ┌──────────────┐   │
│                                  │ 统计          │   │
│                                  │ 管理后台      │   │
│                                  │ 退出登录      │   │
│                                  └──────────────┘   │
├──────────────────────────────────────────────────────┤
│                                                       │
│                     主内容区域                         │
│                                                       │
│                                                       │
└──────────────────────────────────────────────────────┘
```

- 学习页：左侧分类侧栏，右侧文章列表/阅读区
- 刷题页：左侧分类侧栏，右侧题目列表/答题区
- 统计页：全宽展示打卡日历和图表
- 后台管理：全宽布局，表格+表单

## 功能详细设计

### 1. 学习模块

**文章列表页 (/learn)**
- 左侧显示文章分类列表（全部为默认选中）
- 右侧显示文章卡片列表（标题、摘要、日期）
- 点击分类过滤文章

**文章阅读页 (/learn/articles/[slug])**
- 文章正文使用 TipTap 渲染的 HTML（dangerouslySetInnerHTML / TipTap 的 HTML render）
  - 划线笔记实现：
    - 偏移量计算：基于 textContent 纯文本偏移，不受 HTML 标签结构影响
    - 高亮渲染：加载文章时根据 highlights 偏移量将对应文本包裹 `<mark>` 标签
    - 用户选中文字时弹出浮层，包含输入框和保存按钮
    - 右侧或底部展示当前文章笔记列表，点击跳转到高亮位置
    - 笔记可编辑和删除
    - XSS 防护：TipTap 输出的 HTML 用 DOMPurify 过滤后再渲染

### 2. 刷题模块

**今日学习 (/quiz/learn)**
- 进入后选择：分类 + 题目数量
- 系统从该分类中随机选取未学习/未到复习时间的题目
- 逐题展示，用户输入答案后提交
- 提交后展示参考答案，用户自行评分 0-5
- 评分后更新 SM-2 参数到 UserQuestionProgress

**复习模式 (/quiz/review)**
- 进入后展示 `nextReviewDate <= today` 的题目列表
- 逐题作答 → 提交 → 评分 → 更新 SM-2
- 如果当日没有待复习题目，提示"暂无待复习题目"

**收藏管理 (/quiz/bookmarks)**
- 展示用户收藏的所有题目列表
- 可取消收藏

**答题页通用逻辑**
- 展示题目内容（富文本）
- 文本输入框
- 提交按钮
- 提交后展示参考答案和评分按钮（0-5）
- 可收藏题目
- 可添加/查看题目的笔记

### 3. SM-2 算法

每次复习后用户的评分（0-5）决定下次复习间隔：

```
评分 0-2 (回答错误/模糊):
  - repetitions = 0
  - interval = 1
  - ease = max(1.3, ease - 0.2)

评分 3 (回答正确但有难度):
  - repetitions += 1
  - interval = 计算间隔(repetitions, ease)
  - ease = ease - 0.15

评分 4 (回答正确且轻松):
  - repetitions += 1
  - interval = 计算间隔(repetitions, ease)
  - ease = ease + 0.0 (不变)

评分 5 (回答正确且非常轻松):
  - repetitions += 1
  - interval = 计算间隔(repetitions, ease)
  - ease = ease + 0.1

计算间隔:
  if repetitions == 1: interval = 1
  elif repetitions == 2: interval = 6
  else: interval = Math.round(interval * ease)

nextReviewDate = today + interval (天)
```

### 4. 统计与打卡

**打卡机制**
- 用户只要当天学习了至少 1 道题或复习了 1 道题，即自动打卡
- DailyRecord 记录每天的学习量和复习量

**统计页面 (/stats)**
- 打卡日历：月度视图，每天一个格子（类似 GitHub 贡献图），颜色深浅表示学习量
- 连续打卡天数：显示当前 streak
- 学习统计：今日/累计学习题数，各分类占比柱状图
- 复习统计：今日复习题数、待复习题数、正确率折线图

### 5. 用户认证

**注册流程**
- 邮箱 + 密码 + 用户名
- 密码 bcryptjs 加密存储
- 默认角色为 USER

**登录流程**
- next-auth Credentials Provider
- Session 存储在数据库或用 JWT

**权限控制**
- 中间件自动判断路由权限：
  - `/admin/*` 需要 ADMIN 角色
  - `/(main)/*` 需要登录
  - `/(auth)/*` 未登录可访问

### 6. 管理后台

**用户管理 (/admin/users)**
- 展示所有用户列表
- 可编辑用户角色（USER ↔ ADMIN）
- 可禁用用户账号

**文章分类管理 (/admin/articles/categories)**
- CRUD 分类（名称、slug、排序）

**文章编辑 (/admin/articles/[id])**
- TipTap 富文本编辑器
- 选择分类、填写标题、摘要
- 发布/保存草稿

**题目分类管理 (/admin/questions/categories)**
- CRUD 分类

**题目编辑 (/admin/questions/[id])**
- 题目内容（富文本）
- 参考答案（富文本）
- 选择分类

## 项目目录结构

```
yg_learn/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts              # 初始数据（默认管理员账号、示例文章/题目）
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx            # 顶部导航 + 用户菜单
│   │   │   ├── page.tsx              # 仪表盘
│   │   │   ├── learn/
│   │   │   ├── quiz/
│   │   │   └── stats/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx            # 管理后台布局
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   ├── articles/
│   │   │   └── questions/
│   │   └── api/
│   │       └── auth/[...nextauth]/
│   ├── components/
│   │   ├── ui/                       # shadcn/ui 组件
│   │   ├── learn/                    # 学习模块组件
│   │   ├── quiz/                     # 刷题模块组件
│   │   ├── admin/                    # 管理后台组件
│   │   └── shared/                   # 通用组件
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── auth.ts                   # NextAuth 配置
│   │   ├── sm2.ts                    # SM-2 算法
│   │   └── utils.ts                  # 工具函数
│   └── types/
│       └── index.ts                  # 共享类型
├── public/                           # 静态资源
├── docker/
│   └── Dockerfile                    # 部署用
└── package.json
```

## 实施顺序

1. **项目初始化** — Next.js + Prisma + Tailwind + shadcn/ui 脚手架搭建
2. **Prisma schema** — 所有数据模型定义 + 迁移
3. **用户认证** — next-auth 集成 + 登录注册页面 + 权限中间件
4. **布局框架** — 顶部导航 + 用户菜单 + 侧栏布局
5. **学习模块** — 文章分类CRUD + 文章CRUD + 阅读页 + 划线笔记
6. **刷题模块** — 题目分类CRUD + 题目CRUD + 答题功能 + 收藏
7. **SM-2 复习** — 算法实现 + 复习模式
8. **统计与打卡** — 每日打卡 + 统计图表
9. **管理后台** — 用户管理 + 各分类/内容管理界面
10. **部署配置** — Dockerfile + 阿里云 ECS 部署

## 不包含的范围 (Out of Scope)

- 第三方登录（GitHub/Google）
- 图片上传与管理（初期用外部 URL）
- 文章/题目搜索功能
- WebSocket 实时功能
- 移动端 App
