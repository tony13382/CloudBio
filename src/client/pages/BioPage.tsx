import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import type { Block } from "../hooks/useBlocks";
import type { Appearance } from "../hooks/useAppearance";
import { FONT_SIZE_MAP, type FontSize } from "../../lib/block-types";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import PageHeader from "../components/PageHeader";
import BannerCarousel from "../components/BannerCarousel";
import { renderMarkdown } from "../../lib/markdown";
import type { SocialLink } from "../../lib/social-platforms";

const socialSvgs = import.meta.glob("../assets/social/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
function getSocialIconUrl(platform: string): string | undefined {
  return socialSvgs[`../assets/social/${platform}.svg`];
}

type BioData = {
  user: {
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    socialLinks: string | null;
  };
  page?: {
    id: string;
    slug: string;
    title: string | null;
    isDefault: boolean;
  };
  blocks: Block[];
  appearance: Appearance | null;
};

function resolveFontSize(key: string): string {
  return FONT_SIZE_MAP[key as FontSize] || "1rem";
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function getButtonRadius(style: string): string {
  switch (style) {
    case "pill": return "9999px";
    case "square": return "0";
    default: return "12px";
  }
}

function BlockRenderer({ block, appearance, username }: { block: Block; appearance: Appearance | null; username: string }) {
  const c: Record<string, unknown> = typeof block.config === "string" ? JSON.parse(block.config) : block.config;
  const buttonStyle = appearance?.buttonStyle ?? "rounded";
  const buttonColor = appearance?.buttonColor ?? "#111827";
  const buttonTextColor = appearance?.buttonTextColor ?? "#ffffff";
  const isOutline = buttonStyle === "outline";
  const textColor = appearance?.textColor ?? "#111827";

  switch (block.type) {
    case "button": {
      const filled = c.filled !== false;
      const fontSize = resolveFontSize(String(c.fontSize || "medium"));
      const showImage = !!c.showImage && !!c.imageUrl;
      const showSubtitle = !!c.showSubtitle && !!c.subtitle;
      const useFilled = filled && !isOutline;
      const animation = String(c.animation || "none");
      const animStyle: React.CSSProperties = animation === "pulse"
        ? { animation: "bio-pulse 2s ease-in-out infinite" }
        : animation === "bounce"
          ? { animation: "bio-bounce 2s ease-in-out infinite" }
          : {};

      const linkType = String(c.linkType || "url");
      const isInternal = linkType === "page" && c.pageSlug;
      const internalHref = isInternal ? `/${username}/${String(c.pageSlug)}` : null;
      const externalHref = String(c.url || "#");

      const content = (
        <>
          {showImage && (
            <img src={String(c.imageUrl)} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          )}
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, ...(showImage ? { flex: 1, minWidth: 0 } : {}) }}>
            <span>{String(c.title || "")}</span>
            {showSubtitle && (
              <span style={{ fontSize: "0.75em", opacity: 0.7 }}>{String(c.subtitle)}</span>
            )}
          </span>
        </>
      );

      const sharedStyle: React.CSSProperties = {
        background: useFilled ? buttonColor : "transparent",
        color: useFilled ? buttonTextColor : buttonColor,
        border: useFilled ? "none" : `2px solid ${buttonColor}`,
        borderRadius: getButtonRadius(buttonStyle),
        fontSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        ...animStyle,
      };

      const sharedClass = "block w-full py-3 px-4 text-center font-medium no-underline transition-transform hover:scale-[1.02]";

      if (internalHref) {
        return (
          <Link to={internalHref} className={sharedClass} style={sharedStyle}>
            {content}
          </Link>
        );
      }

      return (
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className={sharedClass}
          style={sharedStyle}
        >
          {content}
        </a>
      );
    }
    case "banner": {
      const images = (c.images as import("../components/BannerCarousel").BannerSlide[]) || [];
      return <BannerCarousel images={images} autoplay={!!c.autoplay} />;
    }
    case "square": {
      const imgUrl = String(c.imageUrl || "");
      const linkUrl = String(c.linkUrl || "");
      const content = (
        <div>
          <div style={{ position: "relative" }}>
            <img src={imgUrl} alt={String(c.alt || "")} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12, display: "block" }} />
            {!!c.label && <LabelOverlay label={c.label as string} color={c.labelColor as string} position={c.labelPosition as string} />}
          </div>
          {!!c.description && (
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", opacity: 0.7, textAlign: (c.descriptionAlign as "left" | "center" | "right") || "center" }}>
              {String(c.description)}
            </p>
          )}
        </div>
      );
      return linkUrl ? <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>{content}</a> : content;
    }
    case "dual_square": {
      const images = (c.images as { imageUrl: string; linkUrl?: string; alt?: string; label?: string; labelColor?: string; labelPosition?: string; description?: string; descriptionAlign?: string }[]) || [];
      return (
        <div style={{ display: "flex", gap: 8 }}>
          {images.slice(0, 2).map((img, i) => {
            const content = (
              <div key={i} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ position: "relative" }}>
                  <img src={img.imageUrl} alt={img.alt || ""} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12, display: "block" }} />
                  {img.label && <LabelOverlay label={img.label} color={img.labelColor} position={img.labelPosition} />}
                </div>
                {img.description && (
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", opacity: 0.7, textAlign: (img.descriptionAlign as "left" | "center" | "right") || "center" }}>
                    {img.description}
                  </p>
                )}
              </div>
            );
            return img.linkUrl ? (
              <a key={i} href={img.linkUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>{content}</a>
            ) : content;
          })}
        </div>
      );
    }
    case "video": {
      const videoId = extractYouTubeId(String(c.youtubeUrl || ""));
      if (!videoId) return <p style={{ textAlign: "center", opacity: 0.5 }}>Invalid YouTube URL</p>;
      return (
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 12 }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
        </div>
      );
    }
    case "divider": {
      const style = String(c.style || "solid");
      if (style === "blank") {
        return <div style={{ height: "1.5rem" }} aria-hidden />;
      }
      return <hr style={{ border: "none", borderTop: `1px ${style} currentColor`, opacity: 0.2, margin: "0.5rem 0" }} />;
    }
    case "markdown": {
      const source = String(c.content || "");
      if (!source) return null;
      const html = renderMarkdown(source);
      const mdStyle = String(c.style || "card");
      const wrapperStyle: React.CSSProperties = mdStyle === "card"
        ? {
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 20,
          padding: "20px 28px",
          color: "#111827",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }
        : { background: "transparent", padding: 0, color: textColor };
      return (
        <div
          className={`markdown-body markdown-${mdStyle}`}
          style={{ fontSize: "0.95rem", lineHeight: 1.6, ...wrapperStyle }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    case "text": {
      const variant = String(c.variant || "paragraph");
      const baseFontSize = resolveFontSize(String(c.fontSize || "medium"));
      const fontSize = variant === "heading" ? `calc(${baseFontSize} * 1.4)` : baseFontSize;
      const Tag = variant === "heading" ? "h2" : "p";
      return (
        <Tag style={{
          fontSize,
          color: (c.color as string) || textColor,
          fontWeight: c.bold || variant === "heading" ? 700 : undefined,
          fontStyle: c.italic ? "italic" : undefined,
          textDecoration: c.underline ? "underline" : undefined,
          textAlign: (c.align as "left" | "center" | "right") || "center",
          margin: 0,
          marginTop: variant === "heading" ? 16 : 0,
        }}>
          {String(c.content || "")}
        </Tag>
      );
    }
    default:
      return null;
  }
}

function LabelOverlay({ label, color, position }: { label?: string; color?: string; position?: string }) {
  if (!label) return null;
  const posMap: Record<string, React.CSSProperties> = {
    "top-left": { top: 8, left: 8 },
    "top-right": { top: 8, right: 8 },
    "bottom-left": { bottom: 8, left: 8 },
    "bottom-right": { bottom: 8, right: 8 },
  };
  return (
    <span style={{
      position: "absolute",
      ...posMap[position || "top-left"],
      background: color || "#000",
      color: "#fff",
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: "0.75rem",
      fontWeight: 500,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function ShareQRButtons({ pageUrl, displayName, isCard, textColor }: { pageUrl: string; displayName: string; isCard: boolean; textColor: string }) {
  const [showQR, setShowQR] = useState(false);
  const iconColor = isCard ? "#111827" : textColor;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: displayName, url: pageUrl }).catch(() => { });
    } else {
      await navigator.clipboard.writeText(pageUrl);
      alert("已複製連結！");
    }
  };

  return (
    <>
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
        <button onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, opacity: 0.5 }} title="分享">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
        <button onClick={() => setShowQR(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, opacity: 0.5 }} title="QR Code">
          <svg width="22" height="22" viewBox="0 0 24 24" fill={iconColor}>
            <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm11-2h2v2h-2v-2zm-4 0h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm2-4h2v2h-2v-2zm0 4h2v2h-2v-2zm2-2h2v2h-2v-2z" />
          </svg>
        </button>
      </div>

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-xs" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-center">QR Code</DialogTitle>
            <DialogDescription className="text-center">掃描 QR Code 開啟頁面</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pt-4">
            <QRCodeSVG value={pageUrl} size={200} level="M" />
            <p className="text-xs text-muted-foreground break-all text-center">{pageUrl}</p>
            <Button className="w-full" onClick={() => { navigator.clipboard.writeText(pageUrl); }}>
              複製連結
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function BioPage() {
  const { username, pageSlug } = useParams<{ username: string; pageSlug?: string }>();
  const isSubPage = !!pageSlug;
  const [data, setData] = useState<BioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setData(null);
    const endpoint = pageSlug ? `/bio/${username}/${pageSlug}` : `/bio/${username}`;
    api.get<BioData>(endpoint)
      .then((d) => {
        setData(d);
        // Set favicon to user avatar
        if (d.user.avatarUrl) {
          let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = d.user.avatarUrl;
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [username, pageSlug]);

  const displayName = data?.user.displayName || (data ? `@${data.user.username}` : "");
  const fontFamily = data?.appearance?.fontFamily || "Noto Sans TC";

  useEffect(() => {
    if (displayName) document.title = `${displayName}・CloudBio`;
  }, [displayName]);

  const fontLinkRef = useRef<HTMLLinkElement | null>(null);
  useEffect(() => {
    if (!data) return;
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;
    if (fontLinkRef.current) fontLinkRef.current.remove();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.media = "print";
    link.onload = () => { link.media = "all"; };
    document.head.appendChild(link);
    fontLinkRef.current = link;
    return () => { link.remove(); };
  }, [fontFamily, data]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#999" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <h1 style={{ opacity: 0.5 }}>@{username} 尚未建立頁面</h1>
      </div>
    );
  }

  const { user, blocks, appearance } = data;
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();
  const textColor = appearance?.textColor || "#111827";
  const bgType = appearance?.bgType ?? "solid";
  const bgValue = appearance?.bgValue ?? "#f8f9fa";

  const profileStyle = appearance?.profileStyle ?? "blend";
  const isCard = profileStyle === "card";
  const bgBlur = appearance?.bgBlur ?? false;

  const bgCss =
    bgType === "gradient"
      ? `background: ${bgValue};`
      : bgType === "image"
        ? `background: url(${bgValue}) center/cover no-repeat fixed; background-size: cover;`
        : `background-color: ${bgValue};`;

  const blurCss = bgBlur
    ? `.bg-layer { position:fixed; inset:0; z-index:-1; ${bgCss} filter:blur(12px); transform:scale(1.05); } body { background:transparent; }`
    : "";

  return (
    <>
      <style>{`
        @keyframes bio-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes bio-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        body { margin: 0; ${bgCss} min-height: 100vh; }
        ${blurCss}
        .markdown-body > :first-child { margin-top: 0; }
        .markdown-body > :last-child { margin-bottom: 0; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin: 1em 0 0.5em; font-weight: 700; line-height: 1.3; }
        .markdown-body h1 { font-size: 1.4em; }
        .markdown-body h2 { font-size: 1.2em; }
        .markdown-body h3 { font-size: 1.05em; }
        .markdown-body p { margin: 0.5em 0; }
        .markdown-body a { color: #2563eb; text-decoration: underline; }
        .markdown-body ul, .markdown-body ol { margin: 0.5em 0; padding-left: 1.4em; }
        .markdown-body ul { list-style: disc outside; }
        .markdown-body ol { list-style: decimal outside; }
        .markdown-body ul ul { list-style: circle outside; }
        .markdown-body ul ul ul { list-style: square outside; }
        .markdown-body li { margin: 0.25em 0; display: list-item; }
        .markdown-body blockquote { margin: 0.5em 0; padding: 0.25em 0.9em; border-left: 3px solid currentColor; opacity: 1; }
        .markdown-body blockquote > * { opacity: 0.75; }
        .markdown-body code { background: rgba(127,127,127,0.18); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.88em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .markdown-body pre { background: rgba(127,127,127,0.18); padding: 0.8em 1em; border-radius: 8px; overflow-x: auto; font-size: 0.85em; }
        .markdown-body pre code { background: transparent; padding: 0; }
        .markdown-body img { display: block; width: 100%; height: auto; max-width: 100%; border-radius: 8px; }
        .markdown-body hr { border: none; border-top: 1px solid currentColor; opacity: 0.2; margin: 1em 0; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
        .markdown-body th, .markdown-body td { border: 1px solid currentColor; border-color: rgba(127,127,127,0.3); padding: 0.4em 0.6em; text-align: left; }
        .markdown-blend a { color: inherit; text-decoration: underline; }
      `}</style>
      {bgBlur && <div className="bg-layer" />}
      {isSubPage && (
        <PageHeader
          username={user.username}
          title={data.page?.title ?? null}
          displayName={displayName}
          avatarUrl={user.avatarUrl}
        />
      )}
      <div style={{
        minHeight: "100vh",
        fontFamily: `'${fontFamily}', system-ui`,
        color: textColor,
        display: "flex",
        justifyContent: "center",
        padding: isSubPage ? "80px 16px 40px" : "40px 16px",
      }}>
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {/* Profile header — only on main page */}
          {!isSubPage && (
            <div style={{
              width: "100%",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              ...(isCard ? {
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                borderRadius: 20,
                padding: "40px 24px 28px 24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                color: "#111827",
              } : {}),
            }}>
              {/* Share + QR buttons */}
              <ShareQRButtons pageUrl={window.location.href} displayName={displayName} isCard={isCard} textColor={textColor} />

              {/* Avatar */}
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: "rgba(0,0,0,0.1)", color: isCard ? "#111827" : textColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 700,
                }}>
                  {initial}
                </div>
              )}

              {/* Name */}
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", margin: 0, color: isCard ? "#111827" : undefined }}>{displayName}</h1>

              {/* Bio */}
              {user.bio && (
                <p style={{ textAlign: "center", opacity: 0.7, maxWidth: 360, margin: 0, whiteSpace: "pre-line", color: isCard ? "#111827" : undefined }}>{user.bio}</p>
              )}

              {/* Social Links */}
              {(() => {
                let links: SocialLink[] = [];
                try { links = user.socialLinks ? JSON.parse(user.socialLinks) : []; } catch { /* */ }
                if (links.length === 0) return null;
                return (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
                    {links.map((link, i) => {
                      const iconUrl = getSocialIconUrl(link.platform);
                      return (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ opacity: 0.7, transition: "opacity 0.2s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                        >
                          {iconUrl ? (
                            <img src={iconUrl} alt={link.platform} style={{ width: 24, height: 24, filter: isLightColor(isCard ? "#111827" : textColor) ? "invert(1)" : "none" }} />
                          ) : (
                            <span style={{ fontSize: 12 }}>{link.platform}</span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Blocks */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} appearance={appearance} username={user.username} />
            ))}
          </div>

          {/* Footer */}
          <p style={{ fontSize: "0.625rem", opacity: 0.3, marginTop: "auto", paddingTop: 32 }}>
            Powered by CloudBio
          </p>
        </div>
      </div>
    </>
  );
}
