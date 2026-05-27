import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new (require("@prisma/adapter-libsql").PrismaLibSql)({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

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
