import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import {
  LayoutGrid,
  Palette,
  Image,
  Share2,
  Smartphone,
  Zap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const FEATURES = [
  { icon: LayoutGrid, title: "7 種區塊類型", desc: "按鈕、橫幅、方形看板、影片、分隔線、文字，自由組合" },
  { icon: Palette, title: "完整外觀自訂", desc: "背景、字體、按鈕樣式、顏色，打造專屬風格" },
  { icon: Image, title: "圖片上傳與裁切", desc: "拖曳上傳、自動壓縮為 WebP、內建裁切工具" },
  { icon: Share2, title: "社群媒體整合", desc: "一鍵連結 Instagram、LinkedIn、GitHub 等 13 個平台" },
  { icon: Smartphone, title: "行動裝置優先", desc: "響應式設計，手機瀏覽體驗完美" },
  { icon: Zap, title: "全球邊緣部署", desc: "基於 Cloudflare Workers，全球延遲極低" },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xl font-bold tracking-tight">CloudBio</span>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild>
              <Link to="/dashboard">進入後台</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">登入</Link>
              </Button>
              <Button asChild>
                <Link to="/register">免費建立</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center px-6 pt-20 pb-16">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          你的所有連結
          <br />
          <span className="text-muted-foreground">一頁搞定</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          CloudBio 是開源的 Bio Link 建站工具，部署在 Cloudflare 全球邊緣網路。
          建立你的個人連結頁面，分享給全世界。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to={user ? "/dashboard" : "/register"} className="gap-2">
              {user ? "進入後台" : "免費開始"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
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
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-background p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <f.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          CloudBio — 開源 Bio Link 工具 ·{" "}
          <a
            href="https://github.com/tony13382/CloudBio"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
