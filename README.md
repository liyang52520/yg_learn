# 学习刷题平台

基于 Next.js 的学习与间隔重复刷题平台，支持文章阅读（高亮+笔记）和问答复习（SM-2 算法）。

## 功能

- **文章学习** — 分类浏览文章，支持文字高亮、笔记标注、目录导航、图片查看、代码复制
- **问答刷题** — 支持按分类选题，SM-2 间隔重复算法，自评打分，收藏与笔记
- **复习系统** — 到期提醒复习，每日学习记录追踪
- **数据统计** — 日历热力图、记忆曲线图表、学习概况
- **管理员后台** — 文章/题目/分类 CRUD，TipTap 富文本编辑器，用户管理，Zip 备份与恢复

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 16 (App Router), TypeScript |
| 样式 | Tailwind CSS, `tailwindcss/typography` |
| 数据库 | SQLite, Prisma ORM (LibSQL 适配器) |
| 认证 | NextAuth v5, Credentials 登录, bcrypt 密码加密 |
| 富文本 | TipTap (文章/题目编辑) |
| 图表 | Recharts (统计图表) |
| 代码高亮 | highlight.js (文章内代码) |
| 备份 | Adm-Zip (全量/分卷导出导入) |

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
DATABASE_URL="file:./prisma/dev.db" npx prisma db push

# 导入种子数据
DATABASE_URL="file:./prisma/dev.db" npx tsx prisma/seed.ts

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000。

## 默认账号

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | admin@example.com | admin123 |
| 普通用户 | user@example.com | user123 |

## 项目结构

```
src/
├── app/
│   ├── (auth)/           # 登录、注册
│   │   ├── login/
│   │   └── register/
│   ├── (main)/           # 主页面（带导航栏）
│   │   ├── learn/        # 文章学习
│   │   ├── quiz/         # 刷题
│   │   ├── stats/        # 统计
│   │   └── profile/      # 个人设置
│   ├── admin/            # 后台管理
│   │   ├── articles/     # 文章管理
│   │   ├── questions/    # 题目管理
│   │   ├── backup/       # 备份恢复
│   │   └── users/        # 用户管理
│   └── api/              # API 路由
├── components/           # UI 组件
│   ├── admin/            # 后台组件
│   ├── learn/            # 学习组件
│   ├── quiz/             # 刷题组件
│   └── stats/            # 统计组件
├── lib/                  # 工具库
│   ├── auth.ts           # NextAuth 配置
│   ├── prisma.ts         # Prisma 客户端
│   ├── sm2.ts            # SM-2 间隔重复算法
│   ├── backup.ts         # 备份导出逻辑
│   └── utils.ts          # 通用工具
├── types/                # 类型定义
├── generated/            # Prisma 生成客户端
└── middleware.ts         # 路由守卫
```

## Docker 部署

```bash
docker compose -f docker/docker-compose.yml up -d
```

默认使用本地 SQLite 文件，数据持久化在 Docker volume `app-data` 中。部署前请修改 `docker-compose.yml` 中的 `NEXTAUTH_SECRET`。

## 许可证

MIT
