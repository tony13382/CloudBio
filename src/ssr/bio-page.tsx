import { generateCSS } from "./themes";

type User = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

type Block = {
  id: string;
  type: string;
  config: Record<string, unknown>;
};

type Appearance = {
  theme: string | null;
  bgType: string | null;
  bgValue: string | null;
  buttonStyle: string | null;
  buttonColor: string | null;
  buttonTextColor: string | null;
  fontFamily: string | null;
  textColor: string | null;
  profileStyle: string | null;
  customCss: string | null;
};

const FONT_SIZE_MAP: Record<string, string> = {
  small: "0.875rem",
  medium: "1rem",
  large: "1.25rem",
  xlarge: "1.5rem",
};

const LABEL_POSITION_STYLES: Record<string, string> = {
  "top-left": "top:8px;left:8px;",
  "top-right": "top:8px;right:8px;",
  "bottom-left": "bottom:8px;left:8px;",
  "bottom-right": "bottom:8px;right:8px;",
};

function renderLabel(label?: string, color?: string, position?: string): string {
  if (!label) return "";
  const pos = LABEL_POSITION_STYLES[position || "top-left"] || LABEL_POSITION_STYLES["top-left"];
  const bg = escapeHtml(color || "#000000");
  return `<span style="position:absolute;${pos}background:${bg};color:#fff;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:500;white-space:nowrap;">${escapeHtml(label)}</span>`;
}

function renderDescription(desc?: string, align?: string): string {
  if (!desc) return "";
  const textAlign = align || "center";
  return `<p style="margin:4px 0 0;font-size:0.8rem;opacity:0.7;text-align:${escapeHtml(textAlign)};">${escapeHtml(desc)}</p>`;
}

function renderBlock(block: Block, appearance: Appearance | null): string {
  const c = block.config;
  switch (block.type) {
    case "button": {
      const title = escapeHtml(String(c.title || ""));
      const url = escapeHtml(String(c.url || "#"));
      const subtitle = c.showSubtitle && c.subtitle ? escapeHtml(String(c.subtitle)) : "";
      const imageUrl = c.showImage && c.imageUrl ? escapeHtml(String(c.imageUrl)) : "";
      const fontSize = FONT_SIZE_MAP[String(c.fontSize || "medium")] || "1rem";
      const animation = String(c.animation || "none");
      const filled = c.filled !== false;

      const animClass = animation !== "none" ? ` bio-anim-${escapeHtml(animation)}` : "";
      const filledClass = filled ? "" : " link-btn-outline";

      let inner = "";
      if (imageUrl) {
        inner += `<img src="${imageUrl}" alt="" style="width:32px;height:32px;border-radius:8px;object-fit:cover;flex-shrink:0;" />`;
      }
      const textPart = subtitle
        ? `<span style="display:flex;flex-direction:column;align-items:center;gap:2px;"><span>${title}</span><span style="font-size:0.75em;opacity:0.7;">${subtitle}</span></span>`
        : `<span>${title}</span>`;
      inner += textPart;

      const flexStyle = imageUrl ? "display:flex;align-items:center;justify-content:center;gap:10px;" : "";
      return `<a class="link-btn${filledClass}${animClass}" href="${url}" target="_blank" rel="noopener noreferrer" style="${flexStyle}font-size:${fontSize};">${inner}</a>`;
    }
    case "banner": {
      const images = (c.images as { url: string; linkUrl?: string; alt?: string; label?: string; labelColor?: string; labelPosition?: string; description?: string; descriptionAlign?: string }[]) || [];
      if (images.length === 0) return "";
      const slides = images
        .map((img) => {
          const labelHtml = renderLabel(img.label, img.labelColor, img.labelPosition);
          const descHtml = renderDescription(img.description, img.descriptionAlign);
          const inner = `<div style="position:relative;"><img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt || "")}" style="width:100%;height:200px;object-fit:cover;border-radius:12px;" />${labelHtml}</div>${descHtml}`;
          return img.linkUrl
            ? `<a href="${escapeHtml(img.linkUrl)}" target="_blank" rel="noopener noreferrer" style="flex:0 0 85%;text-decoration:none;color:inherit;">${inner}</a>`
            : `<div style="flex:0 0 85%;">${inner}</div>`;
        })
        .join("");
      return `<div class="banner-carousel" style="display:flex;overflow-x:auto;gap:8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:4px;">${slides}</div>`;
    }
    case "square": {
      const imgUrl = escapeHtml(String(c.imageUrl || ""));
      const linkUrl = c.linkUrl ? escapeHtml(String(c.linkUrl)) : "";
      const alt = escapeHtml(String(c.alt || ""));
      const labelHtml = renderLabel(c.label as string, c.labelColor as string, c.labelPosition as string);
      const descHtml = renderDescription(c.description as string, c.descriptionAlign as string);
      const inner = `<div style="position:relative;"><img src="${imgUrl}" alt="${alt}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block;" />${labelHtml}</div>${descHtml}`;
      return linkUrl
        ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;">${inner}</a>`
        : inner;
    }
    case "dual_square": {
      const images = (c.images as { imageUrl: string; linkUrl?: string; alt?: string; label?: string; labelColor?: string; labelPosition?: string; description?: string; descriptionAlign?: string }[]) || [];
      const items = images
        .slice(0, 2)
        .map((img) => {
          const labelHtml = renderLabel(img.label, img.labelColor, img.labelPosition);
          const descHtml = renderDescription(img.description, img.descriptionAlign);
          const inner = `<div style="position:relative;"><img src="${escapeHtml(img.imageUrl)}" alt="${escapeHtml(img.alt || "")}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block;" />${labelHtml}</div>${descHtml}`;
          return img.linkUrl
            ? `<a href="${escapeHtml(img.linkUrl)}" target="_blank" rel="noopener noreferrer" style="flex:1;min-width:0;text-decoration:none;color:inherit;">${inner}</a>`
            : `<div style="flex:1;min-width:0;">${inner}</div>`;
        })
        .join("");
      return `<div style="display:flex;gap:8px;">${items}</div>`;
    }
    case "video": {
      const ytUrl = String(c.youtubeUrl || "");
      const videoId = extractYouTubeId(ytUrl);
      if (!videoId) return `<p style="text-align:center;opacity:0.5;">Invalid YouTube URL</p>`;
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;"><iframe src="https://www.youtube.com/embed/${escapeHtml(videoId)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>`;
    }
    case "divider": {
      const style = String(c.style || "solid");
      return `<hr style="border:none;border-top:1px ${escapeHtml(style)} currentColor;opacity:0.2;margin:0.5rem 0;" />`;
    }
    case "text": {
      const content = escapeHtml(String(c.content || ""));
      const variant = String(c.variant || "paragraph");
      const sizeKey = String(c.fontSize || "medium");
      const baseFontSize = FONT_SIZE_MAP[sizeKey] || "1rem";
      const fontSize = variant === "heading" ? `calc(${baseFontSize} * 1.4)` : baseFontSize;
      const color = c.color ? `color:${escapeHtml(String(c.color))};` : "";
      const bold = c.bold ? "font-weight:700;" : variant === "heading" ? "font-weight:700;" : "";
      const italic = c.italic ? "font-style:italic;" : "";
      const underline = c.underline ? "text-decoration:underline;" : "";
      const align = `text-align:${escapeHtml(String(c.align || "center"))};`;
      const tag = variant === "heading" ? "h2" : "p";
      const mt = variant === "heading" ? "margin-top:1rem;" : "";
      return `<${tag} style="font-size:${fontSize};${color}${bold}${italic}${underline}${align}${mt}margin-bottom:0;">${content}</${tag}>`;
    }
    default:
      return "";
  }
}

export function renderBioPage(
  user: User,
  blocks: Block[],
  appearance: Appearance | null
): string {
  const displayName = user.displayName || `@${user.username}`;
  const css = generateCSS(appearance);
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();

  const fontFamily = appearance?.fontFamily || "Noto Sans TC";
  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;

  const profileStyle = appearance?.profileStyle || "blend";
  const isCard = profileStyle === "card";

  const blocksHtml = blocks.map((b) => renderBlock(b, appearance)).filter(Boolean).join("\n      ");

  const avatarHtml = user.avatarUrl
    ? `<img class="avatar" src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(displayName)}" />`
    : `<div class="avatar-placeholder">${escapeHtml(initial)}</div>`;

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(displayName)} | CloudBio</title>
  <meta name="description" content="${escapeHtml(user.bio || `${displayName} 的個人連結頁面`)}" />
  <meta property="og:title" content="${escapeHtml(displayName)}" />
  <meta property="og:description" content="${escapeHtml(user.bio || `${displayName} 的個人連結頁面`)}" />
  ${user.avatarUrl ? `<link rel="icon" href="${escapeHtml(user.avatarUrl)}" />` : ""}
  ${user.avatarUrl ? `<meta property="og:image" content="${escapeHtml(user.avatarUrl)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" href="${googleFontUrl}" as="style" onload="this.rel='stylesheet'" />
  <noscript><link href="${googleFontUrl}" rel="stylesheet" /></noscript>
  <style>
${css}
.link-btn-outline {
  background: transparent !important;
  border: 2px solid currentColor;
}
@keyframes bio-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
@keyframes bio-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes bio-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
.bio-anim-pulse { animation: bio-pulse 2s ease-in-out infinite; }
.bio-anim-bounce { animation: bio-bounce 2s ease-in-out infinite; }
.bio-anim-shake:hover { animation: bio-shake 0.4s ease-in-out; }
.banner-carousel::-webkit-scrollbar { display: none; }
.banner-carousel { scrollbar-width: none; }
.profile-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  color: #111827;
}
  </style>
</head>
<body>
  <div class="bio-container">
    <div class="${isCard ? "profile-card" : ""}">
    ${avatarHtml}
    <h1 class="display-name"${isCard ? ' style="color:#111827;"' : ""}>${escapeHtml(displayName)}</h1>
    ${user.bio ? `<p class="bio-text"${isCard ? ' style="color:#111827;"' : ""}>${escapeHtml(user.bio).replace(/\n/g, "<br />")}</p>` : ""}
    </div>
    <div class="links">
      ${blocksHtml || '<p style="text-align:center;opacity:0.5;">尚無內容</p>'}
    </div>
    <p class="footer">Powered by CloudBio</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}
