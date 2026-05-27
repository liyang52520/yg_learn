# 学习刷题平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack learning and quiz platform with article reading, spaced repetition review, and stats tracking.

**Architecture:** Next.js 14+ App Router monolith with Prisma ORM + SQLite. Server Components for data fetching, Server Actions for mutations. next-auth for credentials-based auth with role-based access control for admin routes.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Prisma + SQLite, Tailwind CSS + shadcn/ui, next-auth, bcryptjs, TipTap (rich text), recharts (charts), DOMPurify (XSS), lucide-react (icons)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via `create-next-app`)
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `next.config.ts`
- Create: `src/lib/prisma.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/liyang/WebstormProjects/yg_learn
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs zod dompurify recharts lucide-react @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-label @radix-ui/react-separator class-variance-authority clsx tailwind-merge
npm install -D @types/bcryptjs @types/dompurify
```

- [ ] **Step 3: Configure tailwind for shadcn/ui**

Edit `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Add CSS variables for shadcn/ui**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Create Prisma client singleton**

`src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: Create cn utility**

`src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json tailwind.config.ts postcss.config.js next.config.ts src/ public/
git commit -m "chore: scaffold Next.js project with dependencies"
```


### Task 2: Prisma Schema & Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Write Prisma schema**

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  passwordHash String
  name      String
  role      String   @default("USER")
  disabled  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  highlights      ArticleHighlight[]
  progressRecords UserQuestionProgress[]
  questionNotes   QuestionNote[]
  bookmarks       Bookmark[]
  dailyRecords    DailyRecord[]
}

model ArticleCategory {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  articles Article[]
}

model Article {
  id         Int      @id @default(autoincrement())
  title      String
  content    String
  summary    String?
  categoryId Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  category   ArticleCategory    @relation(fields: [categoryId], references: [id])
  highlights ArticleHighlight[]
}

model ArticleHighlight {
  id        Int      @id @default(autoincrement())
  startOffset Int
  endOffset   Int
  text      String
  note      String?
  userId    Int
  articleId Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id])
  article Article @relation(fields: [articleId], references: [id])
}

model QuestionCategory {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  questions Question[]
}

model Question {
  id         Int      @id @default(autoincrement())
  title      String
  content    String
  answer     String
  categoryId Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  category        QuestionCategory      @relation(fields: [categoryId], references: [id])
  progressRecords UserQuestionProgress[]
  bookmarks       Bookmark[]
  notes           QuestionNote[]
}

model UserQuestionProgress {
  id            Int      @id @default(autoincrement())
  userId        Int
  questionId    Int
  ease          Float    @default(2.5)
  interval      Int      @default(0)
  repetitions   Int      @default(0)
  nextReviewDate DateTime
  lastScore     Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  question Question @relation(fields: [questionId], references: [id])

  @@unique([userId, questionId])
}

model QuestionNote {
  id         Int      @id @default(autoincrement())
  content    String
  userId     Int
  questionId Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  question Question @relation(fields: [questionId], references: [id])
}

model Bookmark {
  id         Int      @id @default(autoincrement())
  userId     Int
  questionId Int
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id])
  question Question @relation(fields: [questionId], references: [id])

  @@unique([userId, questionId])
}

model DailyRecord {
  id                Int      @id @default(autoincrement())
  userId            Int
  date              DateTime
  questionsLearned  Int      @default(0)
  questionsReviewed Int      @default(0)
  correctCount      Int      @default(0)
  createdAt         DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, date])
}
```

- [ ] **Step 2: Create .env file**

```bash
echo 'DATABASE_URL="file:./dev.db"' > .env
```

- [ ] **Step 3: Run Prisma migration**

```bash
npx prisma migrate dev --name init
```

Expected output: "Your database is now in sync with your Prisma schema."

- [ ] **Step 4: Write seed script**

`prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", passwordHash: adminPassword, name: "管理员", role: "ADMIN" },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: { email: "user@example.com", passwordHash: userPassword, name: "测试用户", role: "USER" },
  });

  const jsCat = await prisma.articleCategory.create({
    data: { name: "JavaScript", slug: "javascript", description: "JavaScript 相关文章", order: 1 },
  });
  const tsCat = await prisma.articleCategory.create({
    data: { name: "TypeScript", slug: "typescript", description: "TypeScript 相关文章", order: 2 },
  });

  await prisma.article.create({
    data: {
      title: "TypeScript 入门指南",
      content: "<h2>什么是 TypeScript？</h2><p>TypeScript 是 JavaScript 的超集，添加了静态类型支持。</p><h3>基础类型</h3><p>TypeScript 支持 number、string、boolean、array、tuple、enum 等类型。</p><h3>接口</h3><p>接口用于定义对象的形状。</p>",
      summary: "TypeScript 的基础概念和用法",
      categoryId: tsCat.id,
    },
  });

  const feCat = await prisma.questionCategory.create({
    data: { name: "前端基础", slug: "frontend-basics", description: "HTML/CSS/JS 基础", order: 1 },
  });
  const reactCat = await prisma.questionCategory.create({
    data: { name: "React", slug: "react", description: "React 相关题目", order: 2 },
  });

  await prisma.question.create({
    data: {
      title: "什么是闭包？",
      content: "<p>请解释 JavaScript 中的闭包（Closure）是什么，并给出一个例子。</p>",
      answer: "<p>闭包是指一个函数可以访问其外部作用域中的变量，即使外部函数已经执行完毕。</p><pre><code>function outer(x) {\n  return function inner(y) {\n    return x + y;\n  };\n}\nconst add5 = outer(5);\nconsole.log(add5(3)); // 8</code></pre>",
      categoryId: feCat.id,
    },
  });

  await prisma.question.create({
    data: {
      title: "React 中 useState 和 useReducer 的区别",
      content: "<p>请比较 React 中 useState 和 useReducer 两个 Hook 的区别和适用场景。</p>",
      answer: "<p>useState 适用于简单的独立状态，useReducer 适用于复杂的状态逻辑或状态之间有依赖关系的场景。useReducer 通过 reducer 函数集中管理状态变更，更易于测试和调试。</p>",
      categoryId: reactCat.id,
    },
  });

  console.log("Seed completed!");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
```

- [ ] **Step 5: Configure seed in package.json**

Add to `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 6: Install tsx and seed**

```bash
npm install -D tsx
npx prisma db seed
```

- [ ] **Step 7: Commit**

```bash
git add prisma/ .env package.json
git commit -m "feat: add Prisma schema with all models and seed data"
```


### Task 3: User Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/components/AuthProvider.tsx`

- [ ] **Step 1: Write NextAuth configuration**

`src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || user.disabled) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;
        return { id: String(user.id), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
```

- [ ] **Step 2: Create NextAuth API route**

`src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Write auth middleware**

`src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  // Auth pages - redirect to home if already logged in
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // Admin routes - require ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // Main routes - require login
  if (!isLoggedIn && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 4: Update type definitions**

`src/types/index.ts`:

```typescript
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      email: string;
      name: string;
    };
  }
}
```

- [ ] **Step 5: Create AuthProvider**

`src/components/AuthProvider.tsx`:

```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 6: Create login page**

`src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
    if (result?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold text-center">登录</h1>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input name="email" type="email" required className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input name="password" type="password" required className="w-full border rounded-md px-3 py-2" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-primary text-primary-foreground rounded-md py-2 font-medium">登录</button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          还没有账号？<a href="/register" className="text-primary underline">注册</a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create register page**

`src/app/(auth)/register/page.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        name: formData.get("name"),
      }),
    });
    if (res.ok) {
      router.push("/login");
    } else {
      const data = await res.json();
      setError(data.error || "注册失败");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold text-center">注册</h1>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名</label>
            <input name="name" required className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input name="email" type="email" required className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input name="password" type="password" required minLength={6} className="w-full border rounded-md px-3 py-2" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-primary text-primary-foreground rounded-md py-2 font-medium">注册</button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          已有账号？<a href="/login" className="text-primary underline">登录</a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create registration API route**

`src/app/api/register/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, name, role: "USER" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/auth.ts src/middleware.ts src/app/api/ src/app/\(auth\)/ src/components/AuthProvider.tsx src/types/
git commit -m "feat: add user authentication with login/register"
```


### Task 4: Layout Framework

**Files:**
- Create: `src/app/(main)/layout.tsx`
- Create: `src/app/(main)/page.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/components/Navbar.tsx`
- Create: `src/components/UserMenu.tsx`
- Create: `src/app/learn/layout.tsx` (redirect or move)
- Create: `shadcn/ui components` (Button, DropdownMenu, Avatar, Card)

- [ ] **Step 1: Create root layout with AuthProvider**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "学习刷题平台",
  description: "学习和刷题平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create Navbar component**

`src/components/Navbar.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { UserMenu } from "./UserMenu";
import Link from "next/link";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg">LearnHub</Link>
          <div className="flex gap-4">
            <Link href="/learn" className="text-sm font-medium text-muted-foreground hover:text-foreground">学习</Link>
            <Link href="/quiz" className="text-sm font-medium text-muted-foreground hover:text-foreground">刷题</Link>
          </div>
        </div>
        <UserMenu user={user} />
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create UserMenu component**

`src/components/UserMenu.tsx`:

```tsx
"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          {user.name?.[0]}
        </div>
        {user.name}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50 py-1">
          <Link href="/stats" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>统计</Link>
          {(user as any).role === "ADMIN" && (
            <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>管理后台</Link>
          )}
          <hr className="my-1" />
          <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted">退出登录</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create main layout with Navbar**

`src/app/(main)/layout.tsx`:

```tsx
import { Navbar } from "@/components/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Create dashboard page**

`src/app/(main)/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const [totalQuestions, pendingReview, todayRecord, streak] = await Promise.all([
    prisma.userQuestionProgress.count({ where: { userId } }),
    prisma.userQuestionProgress.count({
      where: { userId, nextReviewDate: { lte: new Date() }, repetitions: { gt: 0 } },
    }),
    prisma.dailyRecord.findFirst({
      where: {
        userId,
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    (async () => {
      const records = await prisma.dailyRecord.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 365,
      });
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < records.length; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const recordDate = records[i]?.date;
        if (recordDate && new Date(recordDate).toDateString() === d.toDateString()) {
          streak++;
        } else break;
      }
      return streak;
    })(),
  ]);

  const todayLearned = todayRecord?.questionsLearned ?? 0;
  const todayReviewed = todayRecord?.questionsReviewed ?? 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">你好，{session?.user?.name}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">今日学习</p>
          <p className="text-2xl font-bold">{todayLearned}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">今日复习</p>
          <p className="text-2xl font-bold">{todayReviewed}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">待复习</p>
          <p className="text-2xl font-bold">{pendingReview}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">连续打卡</p>
          <p className="text-2xl font-bold">{streak} 天</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/quiz/learn" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">今日学习</h2>
          <p className="text-sm text-muted-foreground">选择分类和学习数量，开始学习新题目</p>
        </Link>
        <Link href="/quiz/review" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">复习模式</h2>
          <p className="text-sm text-muted-foreground">{pendingReview > 0 ? `有 ${pendingReview} 道题待复习` : "暂无待复习题目"}</p>
        </Link>
        <Link href="/learn" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">查看文章</h2>
          <p className="text-sm text-muted-foreground">阅读技术文章，学习新知识</p>
        </Link>
        <Link href="/stats" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">学习统计</h2>
          <p className="text-sm text-muted-foreground">查看打卡日历和学习数据</p>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/\(main\)/ src/components/Navbar.tsx src/components/UserMenu.tsx
git commit -m "feat: add layout framework with navbar and dashboard"
```


### Task 5: Learning Module — Article Management (Admin)

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/articles/categories/page.tsx`
- Create: `src/app/admin/articles/[id]/page.tsx`
- Create: `src/app/admin/articles/page.tsx`
- Create: `src/components/admin/ArticleCategoryForm.tsx`
- Create: `src/components/admin/ArticleForm.tsx`
- Create: `src/components/admin/TipTapEditor.tsx`

- [ ] **Step 1: Create admin layout**

`src/app/admin/layout.tsx`:

```tsx
import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-card p-4 space-y-2">
        <h2 className="font-bold text-lg mb-4">管理后台</h2>
        <Link href="/admin" className="block text-sm py-1 hover:text-primary">概览</Link>
        <Link href="/admin/users" className="block text-sm py-1 hover:text-primary">用户管理</Link>
        <div className="text-sm font-medium text-muted-foreground mt-4 mb-1">文章管理</div>
        <Link href="/admin/articles/categories" className="block text-sm py-1 pl-2 hover:text-primary">文章分类</Link>
        <Link href="/admin/articles" className="block text-sm py-1 pl-2 hover:text-primary">文章列表</Link>
        <div className="text-sm font-medium text-muted-foreground mt-4 mb-1">题目管理</div>
        <Link href="/admin/questions/categories" className="block text-sm py-1 pl-2 hover:text-primary">题目分类</Link>
        <Link href="/admin/questions" className="block text-sm py-1 pl-2 hover:text-primary">题目列表</Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create admin dashboard page**

`src/app/admin/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [users, articles, questions] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.question.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台概览</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">用户数</p>
          <p className="text-3xl font-bold">{users}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">文章数</p>
          <p className="text-3xl font-bold">{articles}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">题目数</p>
          <p className="text-3xl font-bold">{questions}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create TipTap editor component**

`src/components/admin/TipTapEditor.tsx`:

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

export function TipTapEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4" } },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content && !mounted) {
      editor.commands.setContent(content);
    }
  }, [editor, content, mounted]);

  if (!mounted) return <div className="border rounded-md min-h-[300px] p-4 bg-muted animate-pulse" />;

  const buttons = [
    { label: "B", action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold"), className: "font-bold" },
    { label: "I", action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic"), className: "italic" },
    { label: "H1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }) },
    { label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
    { label: "H3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }) },
    { label: "•", action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") },
    { label: "1.", action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") },
    { label: "<>", action: () => editor?.chain().focus().toggleCodeBlock().run(), active: editor?.isActive("codeBlock") },
  ];

  return (
    <div className="border rounded-md">
      <div className="flex gap-1 p-2 border-b bg-muted/50 flex-wrap">
        {buttons.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={b.action}
            className={`px-2 py-1 text-sm rounded ${b.active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
```

- [ ] **Step 4: Create article category management page**

`src/app/admin/articles/categories/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { ArticleCategoryForm } from "@/components/admin/ArticleCategoryForm";

export default async function ArticleCategoriesPage() {
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">文章分类管理</h1>
      <ArticleCategoryForm />
      <table className="w-full mt-6 border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">排序</th>
            <th className="text-left p-3">名称</th>
            <th className="text-left p-3">Slug</th>
            <th className="text-left p-3">描述</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-3">{c.order}</td>
              <td className="p-3">{c.name}</td>
              <td className="p-3 text-muted-foreground">{c.slug}</td>
              <td className="p-3 text-muted-foreground">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Create ArticleCategoryForm**

`src/components/admin/ArticleCategoryForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArticleCategoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await fetch("/api/admin/article-categories", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        order: Number(formData.get("order")),
      }),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">添加分类</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-card p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold mb-4">添加文章分类</h2>
            <form action={handleSubmit} className="space-y-3">
              <input name="name" placeholder="分类名称" required className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="slug" placeholder="slug (如: javascript)" required className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="description" placeholder="描述（可选）" className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="order" type="number" placeholder="排序" defaultValue={0} className="w-full border rounded-md px-3 py-2 text-sm" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border rounded-md text-sm">取消</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create article categories API**

`src/app/api/admin/article-categories/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const category = await prisma.articleCategory.create({ data });
  return NextResponse.json(category);
}
```

- [ ] **Step 7: Create article list page**

`src/app/admin/articles/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/articles/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">写文章</Link>
      </div>
      <table className="w-full border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">标题</th>
            <th className="text-left p-3">分类</th>
            <th className="text-left p-3">更新时间</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="p-3">{a.title}</td>
              <td className="p-3 text-muted-foreground">{a.category.name}</td>
              <td className="p-3 text-muted-foreground">{new Date(a.updatedAt).toLocaleDateString()}</td>
              <td className="p-3">
                <Link href={`/admin/articles/${a.id}`} className="text-primary text-sm">编辑</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 8: Create article edit page**

`src/app/admin/articles/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = id === "new" ? null : await prisma.article.findUnique({ where: { id: Number(id) } });
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{article ? "编辑文章" : "写文章"}</h1>
      <ArticleForm article={article} categories={categories} />
    </div>
  );
}
```

- [ ] **Step 9: Create ArticleForm**

`src/components/admin/ArticleForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TipTapEditor } from "./TipTapEditor";

export function ArticleForm({ article, categories }: { article: any; categories: any[] }) {
  const router = useRouter();
  const [content, setContent] = useState(article?.content || "");

  async function handleSubmit(formData: FormData) {
    const res = await fetch(`/api/admin/articles${article ? `/${article.id}` : ""}`, {
      method: article ? "PUT" : "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        summary: formData.get("summary"),
        categoryId: Number(formData.get("categoryId")),
        content,
      }),
    });
    if (res.ok) router.push("/admin/articles");
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-4">
      <input name="title" defaultValue={article?.title} placeholder="文章标题" required className="w-full border rounded-md px-3 py-2" />
      <input name="summary" defaultValue={article?.summary || ""} placeholder="文章摘要（可选）" className="w-full border rounded-md px-3 py-2" />
      <select name="categoryId" defaultValue={article?.categoryId} required className="w-full border rounded-md px-3 py-2">
        <option value="">选择分类</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <TipTapEditor content={content} onChange={setContent} />
      <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md">保存</button>
    </form>
  );
}
```

- [ ] **Step 10: Create articles API**

`src/app/api/admin/articles/route.ts` and `src/app/api/admin/articles/[id]/route.ts`:

```typescript
// src/app/api/admin/articles/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const article = await prisma.article.create({ data });
  return NextResponse.json(article);
}
```

```typescript
// src/app/api/admin/articles/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const article = await prisma.article.update({ where: { id: Number(id) }, data });
  return NextResponse.json(article);
}
```

- [ ] **Step 11: Install tiptap dependencies**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm
```

- [ ] **Step 12: Commit**

```bash
git add src/app/admin/ src/components/admin/ src/app/api/admin/
git commit -m "feat: add admin article management with TipTap editor"
```


### Task 6: Learning Module — Frontend (Reader + Highlights)

**Files:**
- Create: `src/app/(main)/learn/page.tsx`
- Create: `src/app/(main)/learn/articles/[slug]/page.tsx`
- Create: `src/components/learn/ArticleCard.tsx`
- Create: `src/components/learn/ArticleReader.tsx`
- Create: `src/components/learn/HighlightLayer.tsx`
- Create: `src/app/api/highlights/route.ts`
- Create: `src/app/api/highlights/[id]/route.ts`

- [ ] **Step 1: Create learn page with category sidebar**

`src/app/(main)/learn/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/learn/ArticleCard";

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });
  const articles = await prisma.article.findMany({
    where: category ? { category: { slug: category } } : {},
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-56 border-r p-4 space-y-2">
        <a href="/learn" className={`block text-sm py-1 ${!category ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}>全部</a>
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/learn?category=${c.slug}`}
            className={`block text-sm py-1 ${category === c.slug ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {c.name}
          </a>
        ))}
      </aside>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl space-y-4">
          {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
          {articles.length === 0 && <p className="text-muted-foreground">暂无文章</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ArticleCard**

`src/components/learn/ArticleCard.tsx`:

```tsx
import Link from "next/link";

export function ArticleCard({ article }: { article: any }) {
  return (
    <Link href={`/learn/articles/${article.id}`} className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors">
      <h2 className="font-semibold">{article.title}</h2>
      {article.summary && <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>}
      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-0.5 rounded">{article.category.name}</span>
        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create article reader page**

`src/app/(main)/learn/articles/[slug]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ArticleReader } from "@/components/learn/ArticleReader";
import { notFound } from "next/navigation";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const article = await prisma.article.findUnique({ where: { id: Number(slug) } });
  if (!article) notFound();

  const highlights = await prisma.articleHighlight.findMany({
    where: { articleId: article.id, userId: Number(session?.user?.id) },
    orderBy: { createdAt: "desc" },
  });

  return <ArticleReader article={article} highlights={highlights} userId={Number(session?.user?.id)} />;
}
```

- [ ] **Step 4: Create ArticleReader component**

`src/components/learn/ArticleReader.tsx`:

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import DOMPurify from "dompurify";

type Highlight = { id: number; startOffset: number; endOffset: number; text: string; note: string | null };

export function ArticleReader({ article, highlights: initialHighlights, userId }: {
  article: any;
  highlights: Highlight[];
  userId: number;
}) {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [popup, setPopup] = useState<{ x: number; y: number; startOffset: number; endOffset: number; text: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);

  const sanitizedContent = DOMPurify.sanitize(article.content);

  const getTextOffsets = useCallback(() => {
    const el = contentRef.current;
    if (!el) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const text = sel.toString();
    if (!text.trim()) return null;

    const fullText = el.textContent || "";
    const startOffset = fullText.indexOf(text);
    if (startOffset === -1) return null;
    return { startOffset, endOffset: startOffset + text.length, text };
  }, []);

  const handleMouseUp = useCallback(() => {
    const offsets = getTextOffsets();
    if (!offsets) { setPopup(null); return; }
    const sel = window.getSelection();
    if (!sel) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setPopup({ ...offsets, x: rect.left, y: rect.bottom + window.scrollY + 4 });
  }, [getTextOffsets]);

  async function saveHighlight() {
    if (!popup) return;
    const res = await fetch("/api/highlights", {
      method: "POST",
      body: JSON.stringify({ articleId: article.id, ...popup, note: noteText }),
    });
    const h = await res.json();
    setHighlights([h, ...highlights]);
    setPopup(null);
    setNoteText("");
  }

  async function deleteHighlight(id: number) {
    await fetch(`/api/highlights/${id}`, { method: "DELETE" });
    setHighlights(highlights.filter((h) => h.id !== id));
  }

  async function updateNote(id: number, note: string) {
    await fetch(`/api/highlights/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
    setHighlights(highlights.map((h) => (h.id === id ? { ...h, note } : h)));
    setEditingNote(null);
  }

  function renderContent() {
    if (highlights.length === 0) return sanitizedContent;
    const el = contentRef.current;
    if (!el) return sanitizedContent;
    const fullText = el.textContent || "";
    const parts: { text: string; highlighted: boolean; note?: string }[] = [];
    let lastIndex = 0;

    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
    for (const h of sorted) {
      if (h.startOffset > lastIndex) parts.push({ text: fullText.slice(lastIndex, h.startOffset), highlighted: false });
      parts.push({ text: fullText.slice(h.startOffset, h.endOffset), highlighted: true, note: h.note || undefined });
      lastIndex = h.endOffset;
    }
    if (lastIndex < fullText.length) parts.push({ text: fullText.slice(lastIndex), highlighted: false });

    return parts.map((p, i) => {
      if (p.highlighted) return `<mark data-highlight="${i}" class="bg-yellow-200 rounded px-0.5 cursor-pointer" title="${p.note || ""}">${p.text}</mark>`;
      return p.text;
    }).join("");
  }

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = renderContent();
    }
  }, [highlights]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{article.title}</h1>
      <div
        ref={contentRef}
        className="prose prose-lg max-w-none"
        onMouseUp={handleMouseUp}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {popup && (
        <div
          className="fixed z-50 bg-card border rounded-lg shadow-lg p-3 w-80"
          style={{ left: Math.min(popup.x, window.innerWidth - 320), top: popup.y }}
        >
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">&ldquo;{popup.text}&rdquo;</p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="写点笔记..."
            className="w-full border rounded-md p-2 text-sm min-h-[60px]"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setPopup(null)} className="text-xs px-3 py-1 border rounded-md">取消</button>
            <button onClick={saveHighlight} className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md">保存</button>
          </div>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2 className="font-semibold mb-3">我的笔记 ({highlights.length})</h2>
          <div className="space-y-3">
            {highlights.map((h) => (
              <div key={h.id} className="bg-muted/30 border rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">&ldquo;{h.text}&rdquo;</p>
                {editingNote === h.id ? (
                  <div>
                    <textarea
                      defaultValue={h.note || ""}
                      className="w-full border rounded-md p-2 text-sm min-h-[60px]"
                      id={`note-${h.id}`}
                    />
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => {
                        const el = document.getElementById(`note-${h.id}`) as HTMLTextAreaElement;
                        updateNote(h.id, el.value);
                      }} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">保存</button>
                      <button onClick={() => setEditingNote(null)} className="text-xs px-2 py-1 border rounded">取消</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{h.note || <span className="text-muted-foreground italic">无笔记</span>}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditingNote(h.id)} className="text-xs text-primary">编辑</button>
                  <button onClick={() => deleteHighlight(h.id)} className="text-xs text-red-500">删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create highlights API**

`src/app/api/highlights/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { articleId, startOffset, endOffset, text, note } = await req.json();
  const highlight = await prisma.articleHighlight.create({
    data: { articleId, startOffset, endOffset, text, note, userId: Number(session.user.id) },
  });
  return NextResponse.json(highlight);
}
```

`src/app/api/highlights/[id]/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.articleHighlight.deleteMany({ where: { id: Number(id), userId: Number(session.user.id) } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { note } = await req.json();
  const highlight = await prisma.articleHighlight.updateMany({
    where: { id: Number(id), userId: Number(session.user.id) },
    data: { note },
  });
  return NextResponse.json(highlight);
}
```

- [ ] **Step 6: Install DOMPurify**

```bash
npm install dompurify
npm install -D @types/dompurify
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(main\)/learn/ src/components/learn/ src/app/api/highlights/
git commit -m "feat: add article reader with highlight and note functionality"
```


### Task 7: Quiz Module — Question Management (Admin)

**Files:**
- Create: `src/app/admin/questions/categories/page.tsx`
- Create: `src/app/admin/questions/page.tsx`
- Create: `src/app/admin/questions/[id]/page.tsx`
- Create: `src/components/admin/QuestionCategoryForm.tsx`
- Create: `src/components/admin/QuestionForm.tsx`
- Create: `src/app/api/admin/question-categories/route.ts`
- Create: `src/app/api/admin/questions/route.ts`
- Create: `src/app/api/admin/questions/[id]/route.ts`

- [ ] **Step 1: Create question category management page**

`src/app/admin/questions/categories/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { QuestionCategoryForm } from "@/components/admin/QuestionCategoryForm";

export default async function QuestionCategoriesPage() {
  const categories = await prisma.questionCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">题目分类管理</h1>
      <QuestionCategoryForm />
      <table className="w-full mt-6 border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">排序</th>
            <th className="text-left p-3">名称</th>
            <th className="text-left p-3">Slug</th>
            <th className="text-left p-3">描述</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-3">{c.order}</td>
              <td className="p-3">{c.name}</td>
              <td className="p-3 text-muted-foreground">{c.slug}</td>
              <td className="p-3 text-muted-foreground">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create QuestionCategoryForm**

`src/components/admin/QuestionCategoryForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuestionCategoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await fetch("/api/admin/question-categories", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        order: Number(formData.get("order")),
      }),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">添加分类</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-card p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold mb-4">添加题目分类</h2>
            <form action={handleSubmit} className="space-y-3">
              <input name="name" placeholder="分类名称" required className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="slug" placeholder="slug" required className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="description" placeholder="描述" className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="order" type="number" placeholder="排序" defaultValue={0} className="w-full border rounded-md px-3 py-2 text-sm" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border rounded-md text-sm">取消</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create question categories API**

`src/app/api/admin/question-categories/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const category = await prisma.questionCategory.create({ data });
  return NextResponse.json(category);
}
```

- [ ] **Step 4: Create question list page**

`src/app/admin/questions/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">题目管理</h1>
        <Link href="/admin/questions/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">添加题目</Link>
      </div>
      <table className="w-full border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">标题</th>
            <th className="text-left p-3">分类</th>
            <th className="text-left p-3">更新时间</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className="border-b">
              <td className="p-3">{q.title}</td>
              <td className="p-3 text-muted-foreground">{q.category.name}</td>
              <td className="p-3 text-muted-foreground">{new Date(q.updatedAt).toLocaleDateString()}</td>
              <td className="p-3">
                <Link href={`/admin/questions/${q.id}`} className="text-primary text-sm">编辑</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Create question edit page**

`src/app/admin/questions/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function QuestionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = id === "new" ? null : await prisma.question.findUnique({ where: { id: Number(id) } });
  const categories = await prisma.questionCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{question ? "编辑题目" : "添加题目"}</h1>
      <QuestionForm question={question} categories={categories} />
    </div>
  );
}
```

- [ ] **Step 6: Create QuestionForm**

`src/components/admin/QuestionForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TipTapEditor } from "./TipTapEditor";

export function QuestionForm({ question, categories }: { question: any; categories: any[] }) {
  const router = useRouter();
  const [content, setContent] = useState(question?.content || "");
  const [answer, setAnswer] = useState(question?.answer || "");

  async function handleSubmit(formData: FormData) {
    const res = await fetch(`/api/admin/questions${question ? `/${question.id}` : ""}`, {
      method: question ? "PUT" : "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        categoryId: Number(formData.get("categoryId")),
        content,
        answer,
      }),
    });
    if (res.ok) router.push("/admin/questions");
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-4">
      <input name="title" defaultValue={question?.title} placeholder="题目标题" required className="w-full border rounded-md px-3 py-2" />
      <select name="categoryId" defaultValue={question?.categoryId} required className="w-full border rounded-md px-3 py-2">
        <option value="">选择分类</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div>
        <label className="block text-sm font-medium mb-1">题目内容</label>
        <TipTapEditor content={content} onChange={setContent} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">参考答案</label>
        <TipTapEditor content={answer} onChange={setAnswer} />
      </div>
      <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md">保存</button>
    </form>
  );
}
```

- [ ] **Step 7: Create questions API**

`src/app/api/admin/questions/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const question = await prisma.question.create({ data });
  return NextResponse.json(question);
}
```

`src/app/api/admin/questions/[id]/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const question = await prisma.question.update({ where: { id: Number(id) }, data });
  return NextResponse.json(question);
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/questions/ src/components/admin/QuestionCategoryForm.tsx src/components/admin/QuestionForm.tsx src/app/api/admin/questions/ src/app/api/admin/question-categories/
git commit -m "feat: add admin question management"
```


### Task 8: SM-2 Algorithm + Quiz Module — Frontend (Learning + Answering)

**Files:**
- Create: `src/lib/sm2.ts`
- Create: `src/app/(main)/quiz/page.tsx` (redirect)
- Create: `src/app/(main)/quiz/learn/page.tsx`
- Create: `src/app/(main)/quiz/categories/page.tsx`
- Create: `src/app/(main)/quiz/bookmarks/page.tsx`
- Create: `src/app/(main)/quiz/[id]/page.tsx`
- Create: `src/components/quiz/AnswerForm.tsx`
- Create: `src/app/api/progress/route.ts`
- Create: `src/app/api/bookmarks/route.ts`
- Create: `src/app/api/question-notes/route.ts`

- [ ] **Step 1: Create quiz redirect page**

`src/app/(main)/quiz/page.tsx`:

```tsx
import { redirect } from "next/navigation";
export default function QuizPage() { redirect("/quiz/learn"); }
```

- [ ] **Step 2: Create quiz learn page (select category + count)**

`src/app/(main)/quiz/learn/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LearnSetup } from "@/components/quiz/LearnSetup";

export default async function QuizLearnPage() {
  const session = await auth();
  const categories = await prisma.questionCategory.findMany({ orderBy: { order: "asc" } });
  const userId = Number(session?.user?.id);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">今日学习</h1>
      <LearnSetup categories={categories} userId={userId} />
    </div>
  );
}
```

- [ ] **Step 3: Create LearnSetup component**

`src/components/quiz/LearnSetup.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LearnSetup({ categories, userId }: { categories: any[]; userId: number }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  async function startLearning() {
    if (!categoryId) return;
    setLoading(true);
    const res = await fetch("/api/quiz/pick", {
      method: "POST",
      body: JSON.stringify({ categoryId: Number(categoryId), count }),
    });
    const data = await res.json();
    if (data.questionIds?.length > 0) {
      router.push(`/quiz/${data.questionIds[0]}?ids=${data.questionIds.join(",")}&mode=learn`);
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">选择分类</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border rounded-md px-3 py-2">
          <option value="">请选择</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">学习数量</label>
        <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full border rounded-md px-3 py-2" />
      </div>
      <button onClick={startLearning} disabled={loading || !categoryId} className="bg-primary text-primary-foreground px-6 py-2 rounded-md disabled:opacity-50">
        {loading ? "加载中..." : "开始学习"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create quiz pick API**

`src/app/api/quiz/pick/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { categoryId, count } = await req.json();

  // Get all questions in this category
  const allQuestions = await prisma.question.findMany({
    where: { categoryId },
    select: { id: true },
  });

  // Get questions the user has already learned
  const learned = await prisma.userQuestionProgress.findMany({
    where: { userId, questionId: { in: allQuestions.map((q) => q.id) } },
    select: { questionId: true },
  });
  const learnedIds = new Set(learned.map((l) => l.questionId));

  // Filter to unlearned questions, shuffle, pick count
  const available = allQuestions.filter((q) => !learnedIds.has(q.id));
  const shuffled = available.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  const questionIds = picked.map((q) => q.id);

  return NextResponse.json({ questionIds });
}
```

- [ ] **Step 5: Create question answer page**

`src/app/(main)/quiz/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnswerForm } from "@/components/quiz/AnswerForm";
import { notFound } from "next/navigation";

export default async function QuizQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string; mode?: string }>;
}) {
  const { id } = await params;
  const { ids, mode } = await searchParams;
  const session = await auth();
  const userId = Number(session?.user?.id);

  const question = await prisma.question.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  });
  if (!question) notFound();

  const questionIds = ids?.split(",").map(Number) || [question.id];
  const currentIndex = questionIds.indexOf(question.id);
  const prevId = currentIndex > 0 ? questionIds[currentIndex - 1] : null;
  const nextId = currentIndex < questionIds.length - 1 ? questionIds[currentIndex + 1] : null;

  const progress = await prisma.userQuestionProgress.findUnique({
    where: { userId_questionId: { userId, questionId: question.id } },
  });
  const isBookmarked = await prisma.bookmark.findUnique({
    where: { userId_questionId: { userId, questionId: question.id } },
  });
  const notes = await prisma.questionNote.findMany({
    where: { userId, questionId: question.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AnswerForm
      question={question}
      progress={progress}
      isBookmarked={!!isBookmarked}
      notes={notes}
      userId={userId}
      mode={mode as "learn" | "review" | undefined}
      prevId={prevId}
      nextId={nextId}
      questionIds={questionIds}
    />
  );
}
```

- [ ] **Step 6: Create AnswerForm component**

`src/components/quiz/AnswerForm.tsx`:

```tsx
"use client";

import DOMPurify from "dompurify";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnswerForm({
  question, progress, isBookmarked: initBookmarked, notes: initNotes, userId, mode, prevId, nextId, questionIds,
}: any) {
  const router = useRouter();
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(initBookmarked);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(initNotes);

  async function handleSubmit() {
    setSubmitted(true);
  }

  async function handleScore(s: number) {
    setScore(s);
    await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({ questionId: question.id, score: s }),
    });
    // record daily activity
    await fetch("/api/daily-record", {
      method: "POST",
      body: JSON.stringify({ questionId: question.id, score: s, mode }),
    });
  }

  async function toggleBookmark() {
    const res = await fetch("/api/bookmarks", {
      method: isBookmarked ? "DELETE" : "POST",
      body: JSON.stringify({ questionId: question.id }),
    });
    if (res.ok) setIsBookmarked(!isBookmarked);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const res = await fetch("/api/question-notes", {
      method: "POST",
      body: JSON.stringify({ questionId: question.id, content: noteText }),
    });
    const note = await res.json();
    setNotes([note, ...notes]);
    setNoteText("");
    setShowNoteInput(false);
  }

  const sanitizedContent = DOMPurify.sanitize(question.content);
  const sanitizedAnswer = DOMPurify.sanitize(question.answer);

  function goToQuestion(id: number) {
    const params = new URLSearchParams();
    params.set("ids", questionIds.join(","));
    if (mode) params.set("mode", mode);
    router.push(`/quiz/${id}?${params.toString()}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="bg-muted px-2 py-0.5 rounded">{question.category.name}</span>
        {mode && <span className="bg-muted px-2 py-0.5 rounded">{mode === "review" ? "复习" : "学习"}</span>}
        {progress && <span>复习次数: {progress.repetitions}</span>}
      </div>

      <div className="prose prose-lg max-w-none mb-6" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="输入你的答案..."
        className="w-full border rounded-md p-4 min-h-[120px]"
        disabled={submitted}
      />

      {!submitted && (
        <button onClick={handleSubmit} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-md">提交答案</button>
      )}

      {submitted && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">参考答案</h3>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedAnswer }} />
          </div>

          <div>
            <h3 className="font-semibold mb-2">自评</h3>
            <div className="flex gap-2">
              {[
                { v: 0, label: "完全忘记" },
                { v: 1, label: "很模糊" },
                { v: 2, label: "有点困难" },
                { v: 3, label: "答对了" },
                { v: 4, label: "轻松" },
                { v: 5, label: "非常轻松" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => handleScore(v)}
                  disabled={score !== null}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    score === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={toggleBookmark} className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted">
              {isBookmarked ? "已收藏" : "收藏"}
            </button>
            <button onClick={() => setShowNoteInput(!showNoteInput)} className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted">
              添加笔记
            </button>
          </div>

          {showNoteInput && (
            <div className="flex gap-2">
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="写笔记..." className="flex-1 border rounded-md px-3 py-2 text-sm" />
              <button onClick={addNote} className="bg-primary text-primary-foreground px-4 rounded-md text-sm">保存</button>
            </div>
          )}

          {notes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">我的笔记</h3>
              <div className="space-y-2">
                {notes.map((n: any) => (
                  <div key={n.id} className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t">
            <div>
              {prevId && (
                <button onClick={() => goToQuestion(prevId)} className="text-sm px-4 py-2 border rounded-md hover:bg-muted">
                  上一题
                </button>
              )}
            </div>
            <div className="text-sm text-muted-foreground self-center">
              {questionIds.indexOf(question.id) + 1} / {questionIds.length}
            </div>
            <div>
              {nextId && (
                <button onClick={() => goToQuestion(nextId)} className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md">
                  下一题
                </button>
              )}
              {!nextId && (
                <button onClick={() => router.push("/")} className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md">
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Write SM-2 algorithm**

`src/lib/sm2.ts`:

```typescript
export function calculateSM2(
  currentEase: number,
  currentInterval: number,
  currentRepetitions: number,
  score: number
): { ease: number; interval: number; repetitions: number; nextReviewDate: Date } {
  let ease = currentEase;
  let interval: number;
  let repetitions = currentRepetitions;

  if (score <= 2) {
    repetitions = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (score === 3) {
    repetitions += 1;
    interval = calculateInterval(repetitions, interval, ease);
    ease = Math.max(1.3, ease - 0.15);
  } else if (score === 4) {
    repetitions += 1;
    interval = calculateInterval(repetitions, interval, ease);
  } else {
    repetitions += 1;
    interval = calculateInterval(repetitions, interval, ease);
    ease = ease + 0.1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return { ease, interval, repetitions, nextReviewDate };
}

function calculateInterval(repetitions: number, _currentInterval: number, ease: number): number {
  if (repetitions === 1) return 1;
  if (repetitions === 2) return 6;
  return Math.round((_currentInterval || 1) * ease);
}
```

- [ ] **Step 8: Create progress API**

`src/app/api/progress/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { calculateSM2 } from "@/lib/sm2";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId, score } = await req.json();

  const existing = await prisma.userQuestionProgress.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  const { ease, interval, repetitions, nextReviewDate } = calculateSM2(
    existing?.ease || 2.5,
    existing?.interval || 0,
    existing?.repetitions || 0,
    score
  );

  const progress = await prisma.userQuestionProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, ease, interval, repetitions, nextReviewDate, lastScore: score },
    update: { ease, interval, repetitions, nextReviewDate, lastScore: score },
  });

  return NextResponse.json(progress);
}
```

- [ ] **Step 9: Create bookmarks API**

`src/app/api/bookmarks/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId } = await req.json();
  const bookmark = await prisma.bookmark.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId },
    update: {},
  });
  return NextResponse.json(bookmark);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId } = await req.json();
  await prisma.bookmark.deleteMany({ where: { userId, questionId } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 10: Create question notes API**

`src/app/api/question-notes/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId, content } = await req.json();
  const note = await prisma.questionNote.create({ data: { userId, questionId, content } });
  return NextResponse.json(note);
}
```

- [ ] **Step 11: Create daily record API**

`src/app/api/daily-record/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId, score, mode } = await req.json();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyRecord.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const isCorrect = score >= 3 ? 1 : 0;
  const isNew = mode === "review" ? 0 : 1;

  if (existing) {
    await prisma.dailyRecord.update({
      where: { userId_date: { userId, date: today } },
      data: {
        questionsLearned: existing.questionsLearned + isNew,
        questionsReviewed: existing.questionsReviewed + (mode === "review" || existing.questionsLearned > 0 ? 1 : 0),
        correctCount: existing.correctCount + isCorrect,
      },
    });
  } else {
    await prisma.dailyRecord.create({
      data: {
        userId,
        date: today,
        questionsLearned: isNew,
        questionsReviewed: mode === "review" ? 1 : 0,
        correctCount: isCorrect,
      },
    });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 12: Create bookmark list page**

`src/app/(main)/quiz/bookmarks/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function BookmarksPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: { question: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">收藏的题目</h1>
      <div className="space-y-3">
        {bookmarks.map((b) => (
          <Link key={b.id} href={`/quiz/${b.question.id}`} className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors">
            <h2 className="font-semibold">{b.question.title}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block">{b.question.category.name}</span>
          </Link>
        ))}
        {bookmarks.length === 0 && <p className="text-muted-foreground">暂无收藏</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 13: Create category-based question browsing page**

`src/app/(main)/quiz/categories/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function QuizCategoriesPage() {
  const categories = await prisma.questionCategory.findMany({
    include: { questions: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">按分类刷题</h1>
      <div className="space-y-6">
        {categories.map((c) => (
          <div key={c.id}>
            <h2 className="font-semibold mb-2">{c.name} ({c.questions.length})</h2>
            <div className="space-y-2">
              {c.questions.map((q) => (
                <Link key={q.id} href={`/quiz/${q.id}`} className="block bg-card border rounded-lg p-3 hover:border-primary transition-colors">
                  {q.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 14: Commit**

```bash
git add src/app/\(main\)/quiz/ src/components/quiz/ src/app/api/progress/ src/app/api/bookmarks/ src/app/api/question-notes/ src/app/api/daily-record/ src/app/api/quiz/ src/lib/sm2.ts
git commit -m "feat: add quiz frontend with learning, answering, bookmarks, and notes"
```


### Task 9: Review Mode

**Files:**
- Create: `src/app/(main)/quiz/review/page.tsx`
- Create: `src/components/quiz/ReviewSession.tsx`

- [ ] **Step 2: Create review setup page**

`src/app/(main)/quiz/review/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReviewSession } from "@/components/quiz/ReviewSession";

export default async function ReviewPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const reviewQuestions = await prisma.userQuestionProgress.findMany({
    where: {
      userId,
      nextReviewDate: { lte: new Date() },
      repetitions: { gt: 0 },
    },
    include: { question: { include: { category: true } } },
    orderBy: { nextReviewDate: "asc" },
  });

  const stats = await prisma.userQuestionProgress.aggregate({
    where: { userId },
    _count: true,
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">复习模式</h1>
      <p className="text-muted-foreground mb-6">
        已学习 {stats._count} 题，今日待复习 {reviewQuestions.length} 题
      </p>
      <ReviewSession questions={reviewQuestions} />
    </div>
  );
}
```

- [ ] **Step 3: Create ReviewSession component**

`src/components/quiz/ReviewSession.tsx`:

```tsx
"use client";

import DOMPurify from "dompurify";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewSession({ questions }: { questions: any[] }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);

  const question = questions[currentIndex];
  if (!question || questions.length === 0) {
    return <p className="text-muted-foreground">暂无待复习题目，太棒了！</p>;
  }

  async function handleSubmit() {
    setSubmitted(true);
  }

  async function handleScore(s: number) {
    setScore(s);
    await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({ questionId: question.questionId, score: s }),
    });
    await fetch("/api/daily-record", {
      method: "POST",
      body: JSON.stringify({ questionId: question.questionId, score: s, mode: "review" }),
    });
  }

  function next() {
    setCompleted(completed + 1);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setSubmitted(false);
      setScore(null);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  const sanitizedContent = DOMPurify.sanitize(question.question.content);
  const sanitizedAnswer = DOMPurify.sanitize(question.question.answer);

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>{currentIndex + 1} / {questions.length}</span>
        <span className="bg-muted px-2 py-0.5 rounded">{question.question.category.name}</span>
        <span>已完成: {completed}</span>
      </div>

      <div className="prose prose-lg max-w-none mb-6" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="输入你的答案..."
        className="w-full border rounded-md p-4 min-h-[120px]"
        disabled={submitted}
      />

      {!submitted && (
        <button onClick={handleSubmit} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-md">
          提交答案
        </button>
      )}

      {submitted && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">参考答案</h3>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedAnswer }} />
          </div>

          {score === null && (
            <div>
              <h3 className="font-semibold mb-2">自评</h3>
              <div className="flex gap-2">
                {[
                  { v: 0, label: "完全忘记" },
                  { v: 1, label: "很模糊" },
                  { v: 2, label: "有点困难" },
                  { v: 3, label: "答对了" },
                  { v: 4, label: "轻松" },
                  { v: 5, label: "非常轻松" },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => handleScore(v)}
                    className="px-3 py-1.5 rounded-md text-sm border hover:bg-muted"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {score !== null && (
            <button onClick={next} className="bg-primary text-primary-foreground px-6 py-2 rounded-md">
              {currentIndex < questions.length - 1 ? "下一题" : "完成复习"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/quiz/review/ src/components/quiz/ReviewSession.tsx
git commit -m "feat: add SM-2 algorithm and review mode"
```


### Task 10: Stats & Calendar

**Files:**
- Create: `src/app/(main)/stats/page.tsx`
- Create: `src/components/stats/CalendarHeatmap.tsx`
- Create: `src/components/stats/StatsCards.tsx`

- [ ] **Step 1: Create stats page**

`src/app/(main)/stats/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StatsCards } from "@/components/stats/StatsCards";
import { CalendarHeatmap } from "@/components/stats/CalendarHeatmap";

export default async function StatsPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const [dailyRecords, totalProgress, totalQuestions, bookmarksCount] = await Promise.all([
    prisma.dailyRecord.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.userQuestionProgress.findMany({ where: { userId } }),
    prisma.question.count(),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  const totalLearned = dailyRecords.reduce((s, r) => s + r.questionsLearned, 0);
  const totalReviewed = dailyRecords.reduce((s, r) => s + r.questionsReviewed, 0);
  const totalCorrect = dailyRecords.reduce((s, r) => s + r.correctCount, 0);
  const totalAttempts = totalLearned + totalReviewed;

  // Calculate streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dailyRecords.length; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const recordDate = dailyRecords[i]?.date;
    if (recordDate && new Date(recordDate).toDateString() === d.toDateString()) {
      streak++;
    } else break;
  }

  const pendingReview = totalProgress.filter((p) => new Date(p.nextReviewDate) <= new Date() && p.repetitions > 0).length;

  // Prepare calendar data
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const yearRecords = dailyRecords.filter((r) => new Date(r.date) >= lastYear);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">学习统计</h1>

      <StatsCards
        totalLearned={totalLearned}
        totalReviewed={totalReviewed}
        totalCorrect={totalCorrect}
        totalAttempts={totalAttempts}
        streak={streak}
        pendingReview={pendingReview}
        bookmarksCount={bookmarksCount}
      />

      <CalendarHeatmap records={yearRecords} />
    </div>
  );
}
```

- [ ] **Step 2: Create StatsCards component**

`src/components/stats/StatsCards.tsx`:

```tsx
export function StatsCards({ totalLearned, totalReviewed, totalCorrect, totalAttempts, streak, pendingReview, bookmarksCount }: any) {
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const cards = [
    { label: "累计学习", value: totalLearned },
    { label: "累计复习", value: totalReviewed },
    { label: "正确率", value: `${accuracy}%` },
    { label: "连续打卡", value: `${streak} 天` },
    { label: "待复习", value: pendingReview },
    { label: "收藏", value: bookmarksCount },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create CalendarHeatmap component**

`src/components/stats/CalendarHeatmap.tsx`:

```tsx
"use client";

import { useMemo } from "react";

export function CalendarHeatmap({ records }: { records: any[] }) {
  const dayData = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const key = new Date(r.date).toISOString().split("T")[0];
      map.set(key, (r.questionsLearned || 0) + (r.questionsReviewed || 0));
    });
    return map;
  }, [records]);

  const weeks = useMemo(() => {
    const result: { date: Date; count: number }[][] = [];
    const today = new Date();
    let d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    // Go back to the previous Sunday
    d.setDate(d.getDate() - d.getDay());

    let week: { date: Date; count: number }[] = [];
    while (d <= today) {
      const key = d.toISOString().split("T")[0];
      week.push({ date: new Date(d), count: dayData.get(key) || 0 });
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [dayData]);

  const maxCount = Math.max(...Array.from(dayData.values()), 1);

  function getColor(count: number) {
    if (count === 0) return "bg-muted/30";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return "bg-green-200";
    if (intensity < 0.5) return "bg-green-300";
    if (intensity < 0.75) return "bg-green-400";
    return "bg-green-500";
  }

  const months = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

  return (
    <div className="bg-card border rounded-lg p-4">
      <h2 className="font-semibold mb-4">打卡日历（近一年）</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                  title={`${day.date.toLocaleDateString()}: ${day.count} 题`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-muted/30" />
        <div className="w-3 h-3 rounded-sm bg-green-200" />
        <div className="w-3 h-3 rounded-sm bg-green-300" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <span>多</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/stats/ src/components/stats/
git commit -m "feat: add stats page with calendar heatmap and metrics"
```


### Task 11: User Management (Admin)

**Files:**
- Create: `src/app/admin/users/page.tsx`
- Create: `src/app/api/admin/users/route.ts`

- [ ] **Step 1: Create user management page**

`src/app/admin/users/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { UserActions } from "@/components/admin/UserActions";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
      <table className="w-full border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">ID</th>
            <th className="text-left p-3">用户名</th>
            <th className="text-left p-3">邮箱</th>
            <th className="text-left p-3">角色</th>
            <th className="text-left p-3">状态</th>
            <th className="text-left p-3">注册时间</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-3">{u.id}</td>
              <td className="p-3">{u.name}</td>
              <td className="p-3 text-muted-foreground">{u.email}</td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                  {u.role === "ADMIN" ? "管理员" : "用户"}
                </span>
              </td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded ${u.disabled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {u.disabled ? "禁用" : "正常"}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="p-3">
                <UserActions userId={u.id} currentRole={u.role} disabled={u.disabled} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create UserActions component**

`src/components/admin/UserActions.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";

export function UserActions({ userId, currentRole, disabled }: { userId: number; currentRole: string; disabled: boolean }) {
  const router = useRouter();

  async function toggleRole() {
    await fetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId, role: currentRole === "ADMIN" ? "USER" : "ADMIN" }),
    });
    router.refresh();
  }

  async function toggleDisabled() {
    await fetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId, disabled: !disabled }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button onClick={toggleRole} className="text-xs px-2 py-1 border rounded hover:bg-muted">
        切换角色
      </button>
      <button onClick={toggleDisabled} className={`text-xs px-2 py-1 border rounded hover:bg-muted ${disabled ? "text-green-500" : "text-red-500"}`}>
        {disabled ? "启用" : "禁用"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create user management API**

`src/app/api/admin/users/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const { userId, ...data } = await req.json();
  const user = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json(user);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/users/ src/components/admin/UserActions.tsx src/app/api/admin/users/
git commit -m "feat: add admin user management"
```


### Task 12: Deployment Configuration

**Files:**
- Create: `docker/Dockerfile`
- Create: `docker/docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

`docker/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

`docker/docker-compose.yml`:

```yaml
version: "3.8"
services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/data/dev.db
      - NEXTAUTH_SECRET=your-secret-key-change-in-production
      - NEXTAUTH_URL=http://localhost:3000
    volumes:
      - app-data:/app/data
    restart: unless-stopped

volumes:
  app-data:
```

- [ ] **Step 3: Create .dockerignore**

`.dockerignore`:

```
node_modules
.next
.git
*.db
.env
```

- [ ] **Step 4: Update next.config.ts for standalone output**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 5: Commit**

```bash
git add docker/ .dockerignore next.config.ts
git commit -m "chore: add Docker deployment configuration"
```
