import { generateCSS } from "./themes";
import { renderMarkdown } from "../lib/markdown";

type User = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  gaId?: string | null;
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

function renderBlock(block: Block, appearance: Appearance | null, ctx: { username: string }): string {
  const c = block.config;
  switch (block.type) {
    case "button": {
      const title = escapeHtml(String(c.title || ""));
      const subtitle = c.showSubtitle && c.subtitle ? escapeHtml(String(c.subtitle)) : "";
      const imageUrl = c.showImage && c.imageUrl ? escapeHtml(String(c.imageUrl)) : "";
      const fontSize = FONT_SIZE_MAP[String(c.fontSize || "medium")] || "1rem";
      const animation = String(c.animation || "none");
      const filled = c.filled !== false;

      const animClass = animation !== "none" ? ` bio-anim-${escapeHtml(animation)}` : "";
      const filledClass = filled ? "" : " link-btn-outline";

      const linkType = String(c.linkType || "url");
      const isInternal = linkType === "page" && c.pageSlug;
      const href = isInternal
        ? `/${encodeURIComponent(ctx.username)}/${escapeHtml(String(c.pageSlug))}`
        : escapeHtml(String(c.url || "#"));
      const targetAttr = isInternal ? "" : ' target="_blank" rel="noopener noreferrer"';

      let inner = "";
      if (imageUrl) {
        inner += `<img src="${imageUrl}" alt="" style="width:32px;height:32px;border-radius:8px;object-fit:cover;flex-shrink:0;" />`;
      }
      const textPart = subtitle
        ? `<span style="display:flex;flex-direction:column;align-items:center;gap:2px;${imageUrl ? "flex:1;min-width:0;" : ""}"><span>${title}</span><span style="font-size:0.75em;opacity:0.7;">${subtitle}</span></span>`
        : `<span${imageUrl ? ' style="flex:1;min-width:0;text-align:center;"' : ""}>${title}</span>`;
      inner += textPart;

      const flexStyle = imageUrl ? "display:flex;align-items:center;justify-content:center;gap:10px;" : "";
      return `<a class="link-btn${filledClass}${animClass}" href="${href}"${targetAttr} style="${flexStyle}font-size:${fontSize};">${inner}</a>`;
    }
    case "banner": {
      const images = (c.images as { url: string; linkUrl?: string; alt?: string; label?: string; labelColor?: string; labelPosition?: string; description?: string; descriptionAlign?: string }[]) || [];
      if (images.length === 0) return "";
      const autoplay = c.autoplay === true;
      const multi = images.length > 1;
      const slides = images
        .map((img) => {
          const labelHtml = renderLabel(img.label, img.labelColor, img.labelPosition);
          const inner = `<div style="position:relative;"><img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt || "")}" style="width:100%;height:auto;border-radius:12px;display:block;" />${labelHtml}</div>`;
          return img.linkUrl
            ? `<a href="${escapeHtml(img.linkUrl)}" target="_blank" rel="noopener noreferrer" style="flex:0 0 100%;text-decoration:none;color:inherit;">${inner}</a>`
            : `<div style="flex:0 0 100%;">${inner}</div>`;
        })
        .join("");
      const carousel = `<div class="banner-carousel" style="display:flex;overflow-x:auto;gap:8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;">${slides}</div>`;
      if (!multi) {
        return `<div class="banner-block">${carousel}</div>`;
      }
      const dots = images
        .map((_, i) => `<button type="button" class="banner-dot${i === 0 ? " active" : ""}" data-dot="${i}" aria-label="第 ${i + 1} 張"></button>`)
        .join("");
      const firstAlign = images[0]?.descriptionAlign || "center";
      const descAttrs = images.map((img, idx) => `data-desc-${idx}="${escapeHtml((img.description || '').slice(0, 30))}" data-align-${idx}="${escapeHtml(String(img.descriptionAlign || 'center'))}"`).join(' ');
      const descHtml = `<p class="banner-memo" style="margin:0;font-size:12px;opacity:0.7;flex:1;text-align:${firstAlign};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" ${descAttrs}>${escapeHtml((images[0]?.description || '').slice(0, 30))}</p>`;
      const controls = `<div class="banner-controls"><div class="banner-arrows"><button type="button" class="banner-prev" aria-label="上一張"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button><button type="button" class="banner-next" aria-label="下一張"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button></div>${descHtml}<div class="banner-dots">${dots}</div></div>`;
      return `<div class="banner-block" data-banner${autoplay ? ' data-autoplay="true"' : ""}>${carousel}${controls}</div>`;
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
      if (style === "blank") {
        return `<div style="height:1.5rem;" aria-hidden="true"></div>`;
      }
      return `<hr style="border:none;border-top:1px ${escapeHtml(style)} currentColor;opacity:0.2;margin:0.5rem 0;" />`;
    }
    case "markdown": {
      const source = String(c.content || "");
      if (!source) return "";
      const html = renderMarkdown(source);
      const mdStyle = String(c.style || "card");
      const wrapperStyle = mdStyle === "card"
        ? "background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:20px;padding:20px 28px;color:#111827;box-shadow:0 1px 3px rgba(0,0,0,0.08);font-size:0.95rem;line-height:1.6;"
        : "background:transparent;padding:0;font-size:0.95rem;line-height:1.6;";
      return `<div class="markdown-body markdown-${escapeHtml(mdStyle)}" style="${wrapperStyle}">${html}</div>`;
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

type PageMeta = {
  slug: string;
  title: string | null;
};

export function renderSubPage(
  user: User,
  page: PageMeta,
  blocks: Block[],
  appearance: Appearance | null
): string {
  const displayName = user.displayName || `@${user.username}`;
  const css = generateCSS(appearance);
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();

  const fontFamily = appearance?.fontFamily || "Noto Sans TC";
  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;

  const blocksHtml = blocks.map((b) => renderBlock(b, appearance, { username: user.username })).filter(Boolean).join("\n      ");

  const avatarHtml = user.avatarUrl
    ? `<img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(displayName)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />`
    : `<div style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;font-size:0.95rem;font-weight:700;">${escapeHtml(initial)}</div>`;

  const pageTitle = page.title || displayName;
  const backHref = `/${escapeHtml(user.username)}`;
  const gaSnippet = user.gaId ? renderGaSnippet(user.gaId) : "";

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle)}・${escapeHtml(displayName)}</title>
  <meta name="description" content="${escapeHtml(pageTitle)} - ${escapeHtml(displayName)}" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(displayName)}" />
  ${user.avatarUrl ? `<link rel="icon" href="${escapeHtml(user.avatarUrl)}" />` : `<link rel="icon" type="image/png" href="/favicon.png" />`}
  ${user.avatarUrl ? `<meta property="og:image" content="${escapeHtml(user.avatarUrl)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" href="${googleFontUrl}" as="style" onload="this.rel='stylesheet'" />
  <noscript><link href="${googleFontUrl}" rel="stylesheet" /></noscript>
  ${gaSnippet}
  <style>
${css}
body { padding-top: 72px; }
@keyframes bio-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
@keyframes bio-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes bio-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
.bio-anim-pulse { animation: bio-pulse 2s ease-in-out infinite; }
.bio-anim-bounce { animation: bio-bounce 2s ease-in-out infinite; }
.bio-anim-shake:hover { animation: bio-shake 0.4s ease-in-out; }
.banner-carousel::-webkit-scrollbar { display: none; }
.banner-carousel { scrollbar-width: none; }
.banner-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; gap: 8px; }
.banner-arrows { display: flex; align-items: center; gap: 4px; }
.banner-prev, .banner-next { width: 28px; height: 28px; border-radius: 50%; background: transparent; border: none; color: currentColor; opacity: 0.45; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: opacity 0.15s, background 0.15s; }
.banner-prev:hover, .banner-next:hover { opacity: 1; background: rgba(127,127,127,0.12); }
.banner-dots { display: flex; align-items: center; gap: 6px; }
.banner-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; border: none; opacity: 0.25; padding: 0; cursor: pointer; transition: opacity 0.2s, width 0.2s, border-radius 0.2s; }
.banner-dot:hover { opacity: 0.5; }
.banner-dot.active { opacity: 0.85; width: 18px; border-radius: 3px; }
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
.markdown-body blockquote { margin: 0.5em 0; padding: 0.25em 0.9em; border-left: 3px solid currentColor; }
.markdown-body blockquote > * { opacity: 0.75; }
.markdown-body code { background: rgba(127,127,127,0.18); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.88em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.markdown-body pre { background: rgba(127,127,127,0.18); padding: 0.8em 1em; border-radius: 8px; overflow-x: auto; font-size: 0.85em; }
.markdown-body pre code { background: transparent; padding: 0; }
.markdown-body img { display: block; width: 100%; height: auto; max-width: 100%; border-radius: 8px; }
.markdown-body hr { border: none; border-top: 1px solid currentColor; opacity: 0.2; margin: 1em 0; }
.markdown-body table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
.markdown-body th, .markdown-body td { border: 1px solid rgba(127,127,127,0.3); padding: 0.4em 0.6em; text-align: left; }
.markdown-blend a { color: inherit; text-decoration: underline; }
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  z-index: 100;
  color: #111827;
}
.page-header a { color: inherit; text-decoration: none; display: flex; align-items: center; }
.page-header .title {
  font-size: 0.95rem;
  font-weight: 600;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.page-header .back-btn {
  width: 36px;
  height: 36px;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}
.page-header .back-btn:hover { background: rgba(0,0,0,0.06); }
  </style>
</head>
<body>
  <header class="page-header">
    <a class="back-btn" href="${backHref}" aria-label="返回">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </a>
    <span class="title">${escapeHtml(pageTitle)}</span>
    <a href="${backHref}" aria-label="${escapeHtml(displayName)}">
      ${avatarHtml}
    </a>
  </header>
  <div class="bio-container">
    <div class="links" style="margin-top:0;">
      ${blocksHtml || '<p style="text-align:center;opacity:0.5;">尚無內容</p>'}
    </div>
    <p class="footer">Powered by CloudBio</p>
  </div>
  <script>${bannerScript()}</script>
</body>
</html>`;
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

  const blocksHtml = blocks.map((b) => renderBlock(b, appearance, { username: user.username })).filter(Boolean).join("\n      ");

  const avatarHtml = user.avatarUrl
    ? `<img class="avatar" src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(displayName)}" />`
    : `<div class="avatar-placeholder">${escapeHtml(initial)}</div>`;

  const gaSnippet = user.gaId ? renderGaSnippet(user.gaId) : "";

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(displayName)}・CloudBio</title>
  <meta name="description" content="${escapeHtml(user.bio || `${displayName} 的個人連結頁面`)}" />
  <meta property="og:title" content="${escapeHtml(displayName)}" />
  <meta property="og:description" content="${escapeHtml(user.bio || `${displayName} 的個人連結頁面`)}" />
  ${user.avatarUrl ? `<link rel="icon" href="${escapeHtml(user.avatarUrl)}" />` : `<link rel="icon" type="image/png" href="/favicon.png" />`}
  ${user.avatarUrl ? `<meta property="og:image" content="${escapeHtml(user.avatarUrl)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" href="${googleFontUrl}" as="style" onload="this.rel='stylesheet'" />
  <noscript><link href="${googleFontUrl}" rel="stylesheet" /></noscript>
  ${gaSnippet}
  <style>
${css}
@keyframes bio-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
@keyframes bio-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes bio-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
.bio-anim-pulse { animation: bio-pulse 2s ease-in-out infinite; }
.bio-anim-bounce { animation: bio-bounce 2s ease-in-out infinite; }
.bio-anim-shake:hover { animation: bio-shake 0.4s ease-in-out; }
.banner-carousel::-webkit-scrollbar { display: none; }
.banner-carousel { scrollbar-width: none; }
.banner-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; gap: 8px; }
.banner-arrows { display: flex; align-items: center; gap: 4px; }
.banner-prev, .banner-next { width: 28px; height: 28px; border-radius: 50%; background: transparent; border: none; color: currentColor; opacity: 0.45; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: opacity 0.15s, background 0.15s; }
.banner-prev:hover, .banner-next:hover { opacity: 1; background: rgba(127,127,127,0.12); }
.banner-dots { display: flex; align-items: center; gap: 6px; }
.banner-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; border: none; opacity: 0.25; padding: 0; cursor: pointer; transition: opacity 0.2s, width 0.2s, border-radius 0.2s; }
.banner-dot:hover { opacity: 0.5; }
.banner-dot.active { opacity: 0.85; width: 18px; border-radius: 3px; }
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
.markdown-body blockquote { margin: 0.5em 0; padding: 0.25em 0.9em; border-left: 3px solid currentColor; }
.markdown-body blockquote > * { opacity: 0.75; }
.markdown-body code { background: rgba(127,127,127,0.18); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.88em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.markdown-body pre { background: rgba(127,127,127,0.18); padding: 0.8em 1em; border-radius: 8px; overflow-x: auto; font-size: 0.85em; }
.markdown-body pre code { background: transparent; padding: 0; }
.markdown-body img { display: block; width: 100%; height: auto; max-width: 100%; border-radius: 8px; }
.markdown-body hr { border: none; border-top: 1px solid currentColor; opacity: 0.2; margin: 1em 0; }
.markdown-body table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
.markdown-body th, .markdown-body td { border: 1px solid rgba(127,127,127,0.3); padding: 0.4em 0.6em; text-align: left; }
.markdown-blend a { color: inherit; text-decoration: underline; }
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
  <script>${bannerScript()}</script>
</body>
</html>`;
}

/**
 * Vanilla JS that runs once at the bottom of the SSR page to wire up every
 * `.banner-block` on the page: dot sync, prev/next clicks, and (if
 * `data-autoplay="true"`) a 4s auto-rotate timer that pauses on hover.
 * Kept as a single string so the SSR template can inline it.
 */
function bannerScript(): string {
  return `(function(){
var blocks=document.querySelectorAll('.banner-block[data-banner]');
blocks.forEach(function(block){
  var scroller=block.querySelector('.banner-carousel');
  var dots=block.querySelectorAll('.banner-dot');
  var prev=block.querySelector('.banner-prev');
  var next=block.querySelector('.banner-next');
  if(!scroller||!scroller.firstElementChild)return;
  var gap=8;
  function slideW(){return scroller.firstElementChild.offsetWidth+gap;}
  function cur(){return Math.round(scroller.scrollLeft/slideW());}
  var memo=block.querySelector('.banner-memo');
  function syncDots(){var i=cur();dots.forEach(function(d,j){d.classList.toggle('active',j===i);});if(memo){var t=memo.getAttribute('data-desc-'+i);memo.textContent=t||'';memo.style.textAlign=memo.getAttribute('data-align-'+i)||'center';}}
  function goTo(i){var n=dots.length;var t=((i%n)+n)%n;scroller.scrollTo({left:t*slideW(),behavior:'smooth'});}
  scroller.addEventListener('scroll',syncDots,{passive:true});
  if(prev)prev.addEventListener('click',function(){goTo(cur()-1);});
  if(next)next.addEventListener('click',function(){goTo(cur()+1);});
  dots.forEach(function(d,i){d.addEventListener('click',function(){goTo(i);});});
  if(block.getAttribute('data-autoplay')==='true'&&dots.length>1){
    var paused=false;
    block.addEventListener('mouseenter',function(){paused=true;});
    block.addEventListener('mouseleave',function(){paused=false;});
    setInterval(function(){if(paused)return;var n=dots.length;goTo((cur()+1)%n);},4000);
  }
  syncDots();
});
})();`;
}

function renderGaSnippet(gaId: string): string {
  const id = escapeHtml(gaId.trim());
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`;
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
