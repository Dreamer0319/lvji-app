# 律己 App

> 自律，是男人最顶级的修行

一款专注于自律打卡的应用，帮助用户养成运动、阅读、情绪控制等好习惯。

![律己 App](https://img.shields.io/badge/版本-1.0.0-gold) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 功能特性

- 🔐 **用户系统** - 注册、登录、个人中心
- ✅ **每日打卡** - 运动、阅读、情绪控制三大习惯
- 📊 **数据统计** - 连续天数、周进度、月进度
- 🏆 **成就系统** - 解锁成就徽章
- 🌙 **深色主题** - 高端金色点缀设计
- 💾 **本地存储** - SQLite 数据库，数据完全私有

## 🚀 快速开始

### 方式一：直接运行

```bash
# 克隆仓库
git clone https://github.com/你的用户名/lvji-app.git
cd lvji-app

# 一键启动
./deploy.sh
```

访问 http://localhost:3001

### 方式二：手动启动

```bash
cd backend
npm install
node server.js
```

### 方式三：Docker

```bash
docker-compose up -d
```

## 📁 项目结构

```
lvji-app/
├── backend/
│   ├── server.js        # 后端服务
│   ├── package.json     # 依赖配置
│   └── lvji.db          # SQLite 数据库（自动生成）
├── frontend/
│   └── index.html       # 前端单页应用
├── deploy.sh            # 一键部署脚本
├── Dockerfile           # Docker 镜像配置
├── docker-compose.yml   # Docker Compose 配置
└── README.md
```

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML + CSS + JavaScript |
| 后端 | Node.js + Express |
| 数据库 | SQLite (sql.js) |
| 部署 | Docker / 直接运行 |

## 📱 界面预览

### 首页 - 打卡
- 显示连续打卡天数
- 三大习惯打卡卡片
- 周/月进度条

### 统计页
- 周视图热力图
- 累计打卡数据
- 最长连续天数

### 我的
- 个人信息
- 成就徽章
- 设置选项

## 🎯 默认习惯

| 习惯 | 分类 | 目标 |
|------|------|------|
| 运动 | 修身 | 30分钟 |
| 阅读 | 修心 | 60分钟 |
| 情绪控制 | 修未来 | 每日自评 |

## 📝 开发计划

- [ ] 自定义习惯
- [ ] 数据导出
- [ ] 移动端 App
- [ ] 云同步
- [ ] 社交分享

## 📄 License

MIT License

---

**修身 · 修心 · 修未来**
