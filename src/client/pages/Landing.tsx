import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { useEffect, useRef, useState } from "react";
import type { Block } from "../hooks/useBlocks";
import type { Appearance } from "../hooks/useAppearance";
import PhonePreview from "../components/PhonePreview";
import {
  LayoutGrid,
  Palette,
  Image,
  Share2,
  Smartphone,
  Zap,
  ArrowRight,
  ExternalLink,
  Globe,
  Code2,
  Layers,
  GripVertical,
  Eye,
  ShieldCheck,
  MousePointerClick,
  GalleryHorizontal,
  Square,
  Columns2,
  Play,
  Minus,
  Type,
  FileCode,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "多種區塊類型",
    desc: "按鈕、橫幅、方形看板、雙看板、影片、分隔線、文字 — 自由組合你的頁面佈局。",
  },
  {
    icon: Palette,
    title: "完整外觀自訂",
    desc: "背景漸層、字體、按鈕樣式、全站顏色，甚至支援自訂 CSS，打造真正屬於你的風格。",
  },
  {
    icon: Image,
    title: "圖片上傳與裁切",
    desc: "拖曳上傳後自動壓縮為 WebP 格式，內建裁切工具，頭像與看板圖一次搞定。",
  },
  {
    icon: Share2,
    title: "社群媒體整合",
    desc: "支援 Instagram、YouTube、GitHub、LINE 等超過 20 個平台，一鍵展示所有社群連結。",
  },
  {
    icon: Smartphone,
    title: "行動裝置優先",
    desc: "響應式設計確保任何裝置都有完美瀏覽體驗，搭配即時手機預覽功能。",
  },
  {
    icon: Zap,
    title: "全球邊緣部署",
    desc: "基於 Cloudflare Workers 全球網路，無論訪客在哪裡，頁面載入都在毫秒間完成。",
  },
];

const STEPS = [
  {
    step: "01",
    title: "管理者部署站台",
    desc: "將 CloudBio 部署到你的 Cloudflare 帳號，設定好域名與白名單，即可開放註冊。",
  },
  {
    step: "02",
    title: "使用者建立頁面",
    desc: "受邀的使用者無需任何技術背景，註冊後透過拖曳區塊、自訂主題，直覺完成頁面設計。",
  },
  {
    step: "03",
    title: "一鍵分享上線",
    desc: "頁面即時部署在全球邊緣網路，複製專屬短網址，放到社群簡介或名片上開始分享。",
  },
];

const HIGHLIGHTS = [
  {
    icon: Globe,
    title: "SSR + 邊緣快取",
    desc: "公開頁面伺服器端渲染並快取於 KV，首次載入即有完整 SEO 與極速體驗。",
  },
  {
    icon: Code2,
    title: "完全開源",
    desc: "MIT 授權，程式碼公開透明。自行部署、自由修改、回饋社群。",
  },
  {
    icon: Layers,
    title: "多頁面支援",
    desc: "除了主頁面，還能建立多個子頁面，用自訂 slug 組織不同主題的內容。",
  },
  {
    icon: GripVertical,
    title: "拖曳排序",
    desc: "直覺的拖拉操作，即時調整區塊順序，所見即所得。",
  },
  {
    icon: Eye,
    title: "即時預覽",
    desc: "編輯同時在手機模擬框中預覽最終效果，確保每個細節都到位。",
  },
  {
    icon: ShieldCheck,
    title: "白名單與安全驗證",
    desc: "支援 Email 白名單機制控管註冊，搭配 JWT + HttpOnly Cookie 安全認證。",
  },
];

const BLOCK_DEMOS = [
  {
    key: "button",
    icon: MousePointerClick,
    label: "文字按鈕",
    desc: "可設定連結、副標題、圖示、填滿或外框樣式，還有脈搏、彈跳、搖晃動畫效果。",
  },
  {
    key: "banner",
    icon: GalleryHorizontal,
    label: "橫幅看板",
    desc: "多張圖片輪播，支援標籤、說明文字、自動播放，適合展示作品集或活動資訊。",
  },
  {
    key: "square",
    icon: Square,
    label: "方形看板",
    desc: "一張正方形圖片搭配角落標籤與描述文字，適合單一重點展示。",
  },
  {
    key: "dual_square",
    icon: Columns2,
    label: "雙方格看板",
    desc: "兩張圖片並排，各自可加連結、標籤與說明，左右對照一目了然。",
  },
  {
    key: "video",
    icon: Play,
    label: "影片播放器",
    desc: "嵌入 YouTube 影片，16:9 比例自適應，支援全螢幕播放。",
  },
  {
    key: "divider",
    icon: Minus,
    label: "分隔線",
    desc: "實線、虛線、點線或空白間距，為頁面內容創造視覺節奏。",
  },
  {
    key: "text",
    icon: Type,
    label: "文字區塊",
    desc: "標題或段落文字，自訂字級、顏色、粗體、斜體、對齊方式。",
  },
  {
    key: "markdown",
    icon: FileCode,
    label: "Markdown 卡片",
    desc: "支援完整 Markdown 語法，可選融合或卡片樣式，適合長篇介紹。",
  },
];

const CF_STACK = [
  { name: "Workers", desc: "邊緣運算" },
  { name: "D1", desc: "SQLite 資料庫" },
  { name: "R2", desc: "物件儲存" },
  { name: "KV", desc: "鍵值快取" },
];

/* ------------------------------------------------------------------ */
/*  Demo block data helpers                                            */
/* ------------------------------------------------------------------ */

// Inline SVG data URIs as placeholder images
const PLACEHOLDER_ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 16 16"><path fill="#fff" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>')}`;
const PLACEHOLDER_SQ =`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/></linearGradient></defs><rect fill="url(#g)" width="400" height="400"/></svg>')}`;
const PLACEHOLDER_SQ2 = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c4b5fd"/><stop offset="1" stop-color="#818cf8"/></linearGradient></defs><rect fill="url(#g)" width="400" height="400"/></svg>')}`;
const PLACEHOLDER_WIDE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bae6fd"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect fill="url(#g)" width="800" height="450"/></svg>')}`;
const PLACEHOLDER_WIDE2 = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><rect fill="url(#g)" width="800" height="450"/></svg>')}`;

function mkBlock(id: string, type: string, config: Record<string, unknown>, sortOrder = 0): Block {
  return {
    id,
    userId: "demo",
    pageId: "demo",
    type: type as Block["type"],
    config: JSON.stringify(config),
    isActive: true,
    sortOrder,
    createdAt: null,
    updatedAt: null,
  };
}

const DEMO_BLOCKS: Record<string, Block[]> = {
  button: [
    mkBlock("b1", "button", { title: "我的作品集", url: "#", filled: true, fontSize: "medium" }, 0),
    mkBlock("b2", "button", { title: "聯絡我", subtitle: "歡迎來信", showSubtitle: true, url: "#", filled: true, fontSize: "medium" }, 1),
    mkBlock("b3", "button", { title: "GitHub 主頁", url: "#", filled: true, fontSize: "medium", showImage: true, imageUrl: PLACEHOLDER_ICON }, 2),
  ],
  banner: [
    mkBlock("bn1", "banner", {
      images: [
        { url: PLACEHOLDER_WIDE, label: "最新作品", labelColor: "#111827", labelPosition: "top-left", description: "2024 設計作品集精選" },
        { url: PLACEHOLDER_WIDE2, label: "活動回顧", labelColor: "#b45309", labelPosition: "top-left", description: "年度設計研討會紀錄" },
      ],
      autoplay: false,
    }),
  ],
  square: [
    mkBlock("sq1", "square", {
      imageUrl: PLACEHOLDER_SQ,
      label: "精選推薦",
      labelColor: "#111827",
      labelPosition: "bottom-left",
      description: "這是圖片的說明文字",
      descriptionAlign: "center",
    }),
  ],
  dual_square: [
    mkBlock("ds1", "dual_square", {
      images: [
        { imageUrl: PLACEHOLDER_SQ, label: "Before", labelColor: "#111827", labelPosition: "top-left", description: "改造前" },
        { imageUrl: PLACEHOLDER_SQ2, label: "After", labelColor: "#4f46e5", labelPosition: "top-left", description: "改造後" },
      ],
    }),
  ],
  video: [
    mkBlock("v1", "video", { youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }),
  ],
  divider: [
    mkBlock("t1", "text", { content: "區段一", variant: "heading", fontSize: "medium", align: "center" }, 0),
    mkBlock("d1", "divider", { style: "solid" }, 1),
    mkBlock("t2", "text", { content: "實線分隔上下內容", variant: "paragraph", fontSize: "small", align: "center" }, 2),
    mkBlock("d2", "divider", { style: "dashed" }, 3),
    mkBlock("t3", "text", { content: "虛線風格", variant: "paragraph", fontSize: "small", align: "center" }, 4),
    mkBlock("d3", "divider", { style: "dotted" }, 5),
    mkBlock("t4", "text", { content: "點線風格", variant: "paragraph", fontSize: "small", align: "center" }, 6),
  ],
  text: [
    mkBlock("tx1", "text", { content: "這是標題文字", variant: "heading", fontSize: "large", align: "center", bold: true }, 0),
    mkBlock("tx2", "text", { content: "這是段落文字，可以自訂字級大小、顏色、粗細、斜體、底線與對齊方式。", variant: "paragraph", fontSize: "medium", align: "center" }, 1),
    mkBlock("tx3", "text", { content: "斜體 + 底線效果", variant: "paragraph", fontSize: "medium", align: "center", italic: true, underline: true }, 2),
  ],
  markdown: [
    mkBlock("md1", "markdown", {
      content: "## 關於我\n\n嗨！我是一名設計師，專注於**使用者體驗**與介面設計。\n\n- 五年以上設計經驗\n- 曾任職於科技新創公司\n\n```\nconsole.log(\"Hello World!\")\n```",
      style: "card",
    }),
  ],
};

const DEMO_APPEARANCE: Appearance = {
  id: "demo",
  userId: "demo",
  theme: null,
  bgType: "solid",
  bgValue: "#f8f9fa",
  buttonStyle: "rounded",
  buttonColor: "#111827",
  buttonTextColor: "#ffffff",
  fontFamily: "Noto Sans TC",
  textColor: "#111827",
  profileStyle: "blend",
  bgBlur: null,
  customCss: null,
  updatedAt: null,
};

/* ------------------------------------------------------------------ */
/*  Scroll-reveal hook                                                 */
/* ------------------------------------------------------------------ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    const children = el.querySelectorAll(".reveal");
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const { user } = useAuth();
  const revealRef = useReveal();
  const [activeBlock, setActiveBlock] = useState("button");

  return (
    <div ref={revealRef} className="min-h-screen bg-background text-foreground">
      {/* ---------- Navigation ---------- */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="CloudBio" className="h-7 w-7" />
            <span className="text-lg font-semibold tracking-tight">CloudBio</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {user ? (
              <Button size="sm" asChild>
                <Link to="/dashboard">進入後台</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">登入</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">免費開始</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        {/* Gradient orb */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2">
          <div className="h-[480px] w-[720px] rounded-full bg-gradient-to-b from-foreground/[0.06] to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pt-28 pb-20 text-center sm:pt-36 sm:pb-28">
          <div className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              開源 · MIT License
            </span>
          </div>

          <h1 className="reveal opacity-0 translate-y-6 transition-all duration-700 delay-100 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <span className="block text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              你的所有連結
            </span>
            <span className="mt-2 block text-5xl font-bold tracking-tight text-muted-foreground/60 sm:text-6xl lg:text-7xl">
              一頁搞定
            </span>
          </h1>

          <p className="reveal mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground opacity-0 translate-y-6 transition-all duration-700 delay-200 ease-out sm:text-xl [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            CloudBio 是開源的個人連結頁面建站工具，部署在 Cloudflare 全球邊緣網路。
            <br className="hidden sm:block" />
            用拖曳區塊、自訂主題、即時預覽，幾分鐘內打造你的專屬頁面。
          </p>

          <div className="reveal mt-10 flex flex-col items-center justify-center gap-3 opacity-0 translate-y-6 transition-all duration-700 delay-300 ease-out sm:flex-row [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link to={user ? "/dashboard" : "/register"} className="gap-2">
                {user ? "進入後台" : "免費開始"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <a
                href="https://github.com/tony13382/CloudBio"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- Built with Cloudflare ---------- */}
      <section className="reveal border-y border-border/50 bg-muted/30 opacity-0 transition-opacity duration-700 [&.revealed]:opacity-100">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-7">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">
            Built with Cloudflare
          </span>
          {CF_STACK.map((t) => (
            <span key={t.name} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground/70">{t.name}</span>
              <span className="text-xs text-muted-foreground/50">{t.desc}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Features Grid ---------- */}
      <section className="mx-auto max-w-6xl px-6 pt-28 pb-20">
        <div className="reveal mb-16 text-center opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            你需要的一切，都在這裡
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            從區塊排版到外觀設計，CloudBio 提供完整工具讓你專注於內容。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="reveal bg-background p-8 opacity-0 translate-y-4 transition-all duration-500 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Block Types Demo ---------- */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <div className="reveal mb-16 text-center opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              8 種區塊，無限組合
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              每種區塊都有專屬的設定選項，點擊下方按鈕預覽各區塊的實際效果。
            </p>
          </div>

          <div className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
              {/* Phone mockup — using real PhonePreview component */}
              <div className="shrink-0 order-1 lg:order-2">
                <PhonePreview
                  username="demo"
                  displayName="CloudBio Demo"
                  bio="點擊左側區塊類型，預覽實際效果"
                  blocks={DEMO_BLOCKS[activeBlock] || []}
                  appearance={DEMO_APPEARANCE}
                />
              </div>

              {/* Block selector list */}
              <div className="flex-1 order-2 lg:order-1 w-full">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {BLOCK_DEMOS.map((b) => {
                    const isActive = activeBlock === b.key;
                    return (
                      <button
                        key={b.key}
                        onClick={() => setActiveBlock(b.key)}
                        className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                          isActive
                            ? "border-foreground/20 bg-background shadow-md"
                            : "border-transparent bg-transparent hover:bg-background/60"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <b.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-foreground/70"}`}>
                            {b.label}
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {b.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <div className="reveal mb-16 text-center opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">三步驟，即刻上線</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            管理者一次部署完成，使用者不需要任何技術背景。
            <br className="hidden sm:block" />
            支援 Email 白名單機制，確保只有受邀者能註冊使用。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.step}
              className="reveal opacity-0 translate-y-6 transition-all duration-600 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span className="text-5xl font-bold text-border">{s.step}</span>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Highlights ---------- */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <div className="reveal mb-16 text-center opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">為開發者打造</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              CloudBio 不只是工具，更是完整的全端開源專案，歡迎自行部署與貢獻。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((h, i) => (
              <div
                key={h.title}
                className="reveal group rounded-xl border border-border bg-background p-6 opacity-0 translate-y-4 transition-all duration-500 ease-out hover:border-foreground/20 hover:shadow-lg [&.revealed]:opacity-100 [&.revealed]:translate-y-0"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <h.icon className="mb-3 h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                <h3 className="font-semibold">{h.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- URL Preview ---------- */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground/60">
            你的頁面網址
          </p>
          <div className="mt-6 inline-flex items-center gap-0 overflow-hidden rounded-xl border border-border bg-background text-left shadow-sm">
            <span className="bg-muted/60 px-5 py-3.5 text-sm text-muted-foreground">
              cloudbio.app/
            </span>
            <span className="px-5 py-3.5 text-sm font-semibold">your-username</span>
          </div>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            每位使用者都有專屬的短網址。簡潔好記，適合放在社群簡介、名片或任何需要分享的地方。
          </p>
        </div>
      </section>

      {/* ---------- Open Source CTA ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground px-8 py-16 text-center text-background sm:px-16">
            {/* Decorative dots */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }} />

            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              準備好了嗎？
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-background/60">
              免費註冊，開始打造你的個人連結頁面。
              <br />
              完全開源，永遠免費。
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-background px-8 text-base text-foreground hover:bg-background/90"
                asChild
              >
                <Link to={user ? "/dashboard" : "/register"} className="gap-2">
                  {user ? "進入後台" : "免費開始"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="h-12 border border-background/25 bg-transparent px-8 text-base text-background hover:bg-background/10"
                asChild
              >
                <a
                  href="https://github.com/tony13382/CloudBio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="CloudBio" className="h-6 w-6" />
              <span className="text-sm font-semibold">CloudBio</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://github.com/tony13382/CloudBio"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              <Link to="/login" className="transition-colors hover:text-foreground">
                登入
              </Link>
              <Link to="/register" className="transition-colors hover:text-foreground">
                註冊
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground/60">
            <p>© {new Date().getFullYear()} CloudBio — 開源 Bio Link 建站工具，以 MIT 授權釋出。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
