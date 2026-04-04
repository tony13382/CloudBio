import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppearance } from "../hooks/useAppearance";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import ThemeEditor from "./ThemeEditor";
import React from "react";
import { ExternalLink, LogOut, Palette, Link as LinkIcon } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { appearance, updateAppearance } = useAppearance();
  const navigate = useNavigate();
  const [showAppearance, setShowAppearance] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const bgType = appearance?.bgType ?? "solid";
  const bgValue = appearance?.bgValue ?? "#f8f9fa";
  const bgBlur = appearance?.bgBlur ?? false;
  const bgStyle: React.CSSProperties =
    bgType === "gradient"
      ? { background: bgValue }
      : bgType === "image"
        ? { background: `url(${bgValue}) center/cover no-repeat fixed` }
        : { backgroundColor: bgValue };

  return (
    <div className="min-h-screen relative">
      {/* Background layer */}
      <div className="fixed inset-0 -z-10" style={{ ...bgStyle, filter: bgBlur ? "blur(12px)" : undefined, transform: bgBlur ? "scale(1.05)" : undefined }} />
      <header className="sticky top-0 z-40">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo pill */}
          <div
            className="bg-background shadow-sm hover:shadow rounded-full px-5 py-1.5 cursor-pointer transition-shadow"
            onClick={() => navigate("/dashboard")}
          >
            <span className="text-base font-bold tracking-tight">CloudBio</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 bg-background shadow-sm rounded-full px-1.5 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={() => setShowAppearance(true)}
              title="外觀設定"
            >
              <Palette className="h-4 w-4" />
            </Button>

            <a
              href={`${window.location.origin}/${user?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              /{user?.username}
            </a>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={handleLogout}
              title="登出"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Appearance Sheet */}
      <Sheet open={showAppearance} onOpenChange={setShowAppearance}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>自訂外觀</SheetTitle>
            <SheetDescription>調整背景、按鈕樣式、顏色和字體</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ThemeEditor appearance={appearance} onChange={updateAppearance} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
