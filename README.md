# CloudBio

Bio link 建站工具，部署於 Cloudflare Workers。類似 [Portaly.cc](https://portaly.cc) 的開源替代方案。

## 功能

- **7 種區塊類型**：文字按鈕、橫幅看板、方形看板、雙方格看板、影片播放器、分隔線、文字
- **拖曳排序**：Notion 風格的區塊拖曳排列
- **外觀自訂**：背景（純色/漸層/圖片）、背景模糊、按鈕樣式、顏色、字體、個人資訊卡片樣式
- **圖片上傳**：R2 儲存、客戶端壓縮（WebP）、裁切工具（react-easy-crop）
- **社群媒體連結**：Bootstrap Icons SVG 圖標，支援 13 個平台
- **大頭照**：上傳自訂，同時作為 favicon 和 OG image
- **SSR + CSR**：生產環境 SSR（SEO 友善）、開發環境 CSR fallback
- **JWT 認證**：HttpOnly Cookie、PBKDF2 密碼雜湊
- **信箱白名單**：可透過環境變數限制可註冊的信箱

## 技術棧

| 層級 | 技術 |
|------|------|
| 後端 | [Hono](https://hono.dev) on Cloudflare Workers |
| 前端 | React 19 + [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS v4 |
| 資料庫 | Cloudflare D1 (SQLite) + [Drizzle ORM](https://orm.drizzle.team) |
| 快取 | Cloudflare KV |
| 儲存 | Cloudflare R2 |
| 建構 | Vite + @cloudflare/vite-plugin |

## 快速開始

### 前置需求

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Cloudflare 帳號

### 本機開發

```bash
# 安裝依賴
npm install

# 建立本機 D1 資料庫並執行 migration
npm run db:migrate

# 建立 .dev.vars 設定本機環境變數
echo 'JWT_SECRET=your-random-secret-at-least-32-chars' > .dev.vars

# 啟動開發伺服器
npm run dev
```

### 部署到 Cloudflare

#### 1. 建立遠端資源

```bash
# D1 資料庫
wrangler d1 create cloudbio

# KV 命名空間
wrangler kv namespace create KV

# R2 儲存桶
wrangler r2 bucket create cloudbio-r2
```

#### 2. 更新 `wrangler.toml`

將 `database_id` 和 KV `id` 替換為上一步輸出的真實 ID。

#### 3. 設定 Secrets

```bash
# JWT 簽名金鑰（必要）
echo "your-random-secret" | wrangler versions secret put JWT_SECRET

# 信箱白名單（選填，留空不限制）
echo "alice@example.com,bob@example.com" | wrangler versions secret put ALLOWED_EMAILS
```

#### 4. 執行遠端 Migration

```bash
wrangler d1 migrations apply cloudbio --remote
```

#### 5. 部署

```bash
npm run deploy
```

或綁定 GitHub repo 到 Cloudflare Workers，設定：
- **組建命令**：`npm install && npm run build`
- **部署命令**：`npx wrangler deploy`

## 環境變數

| 變數 | 必要 | 說明 |
|------|------|------|
| `JWT_SECRET` | 是 | JWT 簽名金鑰，建議 32+ 字元隨機字串 |
| `ALLOWED_EMAILS` | 否 | 允許註冊的信箱白名單，逗號分隔。留空不限制 |

## 專案結構

```
src/
├── api/              # Hono API 路由
├── client/           # React SPA
│   ├── assets/       # 社群媒體 SVG 圖標
│   ├── components/   # React 元件 + shadcn/ui
│   ├── hooks/        # 自訂 hooks (useAuth, useBlocks, useAppearance)
│   ├── lib/          # 工具函式 (compress-image, utils)
│   └── pages/        # 頁面元件
├── db/               # Drizzle ORM schema
├── lib/              # 共用邏輯 (block-types, social-platforms, password)
├── middleware/        # JWT 認證中介層
├── services/         # 業務邏輯層
├── ssr/              # SSR 渲染
└── worker.ts         # Hono 進入點
```

## License

MIT
