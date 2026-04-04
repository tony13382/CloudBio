import type { Appearance } from "../hooks/useAppearance";
import type { Block } from "../hooks/useBlocks";
import { parseConfig } from "../hooks/useBlocks";
import { FONT_SIZE_MAP, type FontSize } from "../../lib/block-types";
import type { SocialLink } from "../../lib/social-platforms";
import { getSocialIcon } from "./SocialLinksEditor";

function resolveFontSize(key: string): string {
  return FONT_SIZE_MAP[key as FontSize] || "1rem";
}

type Props = {
  username: string;
  displayName: string | null;
  bio: string | null;
  blocks: Block[];
  appearance: Appearance | null;
  socialLinks?: SocialLink[];
};

function getButtonRadius(style: string): string {
  switch (style) {
    case "pill": return "9999px";
    case "square": return "0";
    default: return "12px";
  }
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

function LabelOverlay({ label, color, position }: { label?: string; color?: string; position?: string }) {
  if (!label) return null;
  const posMap: Record<string, string> = {
    "top-left": "top-1 left-1",
    "top-right": "top-1 right-1",
    "bottom-left": "bottom-1 left-1",
    "bottom-right": "bottom-1 right-1",
  };
  return (
    <span
      className={`absolute ${posMap[position || "top-left"] || posMap["top-left"]} px-1.5 py-0.5 rounded text-[8px] font-medium text-white`}
      style={{ backgroundColor: color || "#000" }}
    >
      {label}
    </span>
  );
}

function BlockRenderer({ block, appearance }: { block: Block; appearance: Appearance | null }) {
  const c = parseConfig(block);
  const buttonStyle = appearance?.buttonStyle ?? "rounded";
  const buttonColor = appearance?.buttonColor ?? "#111827";
  const buttonTextColor = appearance?.buttonTextColor ?? "#ffffff";
  const isOutline = buttonStyle === "outline";
  const textColor = appearance?.textColor ?? "#111827";

  switch (block.type) {
    case "button": {
      const filled = c.filled !== false;
      const fontSize = resolveFontSize(String(c.fontSize || "medium")) || "1rem";
      const showImage = !!c.showImage && !!c.imageUrl;
      const showSubtitle = !!c.showSubtitle && !!c.subtitle;

      const useFilled = filled && !isOutline;
      return (
        <div
          className="w-full py-2.5 px-3 text-center text-xs font-medium flex items-center justify-center gap-2"
          style={{
            background: useFilled ? buttonColor : "transparent",
            color: useFilled ? buttonTextColor : buttonColor,
            border: useFilled ? "none" : `2px solid ${buttonColor}`,
            borderRadius: getButtonRadius(buttonStyle),
            fontSize,
          }}
        >
          {showImage && (
            <img src={String(c.imageUrl)} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
          )}
          <span className="flex flex-col items-center gap-0.5">
            <span className="truncate">{String(c.title || "")}</span>
            {showSubtitle && (
              <span className="text-[9px] opacity-70 truncate">{String(c.subtitle)}</span>
            )}
          </span>
        </div>
      );
    }
    case "banner": {
      const images = (c.images as { url: string; alt?: string; label?: string; labelColor?: string; labelPosition?: string; description?: string; descriptionAlign?: string }[]) || [];
      if (images.length === 0) return null;
      return (
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
          {images.map((img, i) => (
            <div key={i} className="flex-shrink-0" style={{ width: "85%", scrollSnapAlign: "start" }}>
              <div className="relative">
                <img src={img.url} alt={img.alt || ""} className="w-full h-[80px] object-cover rounded-lg" />
                <LabelOverlay label={img.label} color={img.labelColor} position={img.labelPosition} />
              </div>
              {img.description && (
                <p className="text-[8px] opacity-60 mt-0.5 truncate" style={{ textAlign: (img.descriptionAlign as "left" | "center" | "right") || "center" }}>
                  {img.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    case "square": {
      return (
        <div>
          <div className="relative">
            <img
              src={String(c.imageUrl || "")}
              alt={String(c.alt || "")}
              className="w-full aspect-square object-cover rounded-lg block"
            />
            <LabelOverlay label={c.label as string} color={c.labelColor as string} position={c.labelPosition as string} />
          </div>
          {String(c.description || "") !== "" && (
            <p className="text-[8px] opacity-60 mt-0.5" style={{ textAlign: (c.descriptionAlign as "left" | "center" | "right") || "center" }}>
              {String(c.description)}
            </p>
          )}
        </div>
      );
    }
    case "dual_square": {
      const images = (c.images as { imageUrl: string; alt?: string; label?: string; labelColor?: string; labelPosition?: string; description?: string; descriptionAlign?: string }[]) || [];
      return (
        <div className="flex gap-1.5">
          {images.slice(0, 2).map((img, i) => (
            <div key={i} className="flex-1 min-w-0">
              <div className="relative">
                <img src={img.imageUrl} alt={img.alt || ""} className="w-full aspect-square object-cover rounded-lg block" />
                <LabelOverlay label={img.label} color={img.labelColor} position={img.labelPosition} />
              </div>
              {img.description && (
                <p className="text-[8px] opacity-60 mt-0.5 truncate" style={{ textAlign: (img.descriptionAlign as "left" | "center" | "right") || "center" }}>
                  {img.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    case "video": {
      const videoId = extractYouTubeId(String(c.youtubeUrl || ""));
      if (!videoId) return <p className="text-center text-[10px] opacity-40">無效 YouTube 網址</p>;
      return (
        <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="absolute inset-0 w-full h-full border-none"
            allowFullScreen
          />
        </div>
      );
    }
    case "divider": {
      const style = String(c.style || "solid");
      return <hr className="opacity-20 my-1" style={{ borderTop: `1px ${style} ${textColor}` }} />;
    }
    case "text": {
      const variant = String(c.variant || "paragraph");
      const sizeKey = String(c.fontSize || "medium");
      const baseFontSize = resolveFontSize(sizeKey);
      const fontSize = variant === "heading" ? `calc(${baseFontSize} * 1.2)` : baseFontSize;
      const Tag = variant === "heading" ? "h2" : "p";
      return (
        <Tag
          className="m-0"
          style={{
            fontSize,
            color: (c.color as string) || textColor,
            fontWeight: c.bold || variant === "heading" ? 700 : undefined,
            fontStyle: c.italic ? "italic" : undefined,
            textDecoration: c.underline ? "underline" : undefined,
            textAlign: (c.align as "left" | "center" | "right") || "center",
          }}
        >
          {String(c.content || "")}
        </Tag>
      );
    }
    default:
      return null;
  }
}

export default function PhonePreview({ username, displayName, bio, blocks, appearance, socialLinks = [] }: Props) {
  const bgType = appearance?.bgType ?? "solid";
  const bgValue = appearance?.bgValue ?? "#f8f9fa";
  const fontFamily = appearance?.fontFamily ?? "Inter";
  const textColor = appearance?.textColor ?? "#111827";
  const name = displayName || `@${username}`;
  const initial = (displayName || username).charAt(0).toUpperCase();

  const bgStyle =
    bgType === "gradient"
      ? { background: bgValue }
      : bgType === "image"
        ? { background: `url(${bgValue}) center/cover no-repeat` }
        : { backgroundColor: bgValue };

  const profileStyle = appearance?.profileStyle ?? "blend";
  const activeBlocks = blocks.filter((b) => b.isActive !== false);

  const isCard = profileStyle === "card";
  const effectiveIconColor = isCard ? "#111827" : textColor;
  const isLightTextColor = (() => {
    const c = effectiveIconColor.replace("#", "");
    if (c.length < 6) return false;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  })();

  return (
    <div className="flex justify-center">
      <div className="w-[320px] h-[580px] rounded-[2.5rem] border-[8px] border-gray-900 overflow-hidden shadow-2xl">
        <div
          className="w-full h-full overflow-y-auto flex flex-col items-center p-6 gap-3"
          style={{ ...bgStyle, fontFamily: `'${fontFamily}', system-ui`, color: textColor }}
        >
          {/* Profile header */}
          <div
            className={`w-full flex flex-col items-center gap-2 ${isCard ? "bg-white/80 backdrop-blur rounded-2xl p-5 shadow-sm" : ""}`}
          >
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ background: "rgba(0,0,0,0.1)", color: isCard ? "#111827" : textColor }}
            >
              {initial}
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-center" style={{ color: isCard ? "#111827" : textColor }}>
              {name}
            </h2>

            {/* Bio */}
            {bio && (
              <p className="text-sm text-center opacity-70 max-w-[260px] whitespace-pre-line" style={{ color: isCard ? "#111827" : textColor }}>
                {bio}
              </p>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3 flex-wrap justify-center mt-3">
                {socialLinks.map((link, i) => {
                  const iconSrc = getSocialIcon(link.platform);
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                      {iconSrc ? (
                        <img src={iconSrc} alt={link.platform} className="w-5 h-5" style={{ filter: isLightTextColor ? "invert(1)" : "none" }} />
                      ) : (
                        <span className="text-[8px]">{link.platform}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blocks */}
          <div className="w-full space-y-2.5 mt-2">
            {activeBlocks.map((block) => (
              <BlockRenderer key={block.id} block={block} appearance={appearance} />
            ))}
            {activeBlocks.length === 0 && (
              <p className="text-center text-sm opacity-40">尚無內容</p>
            )}
          </div>

          <p className="text-[10px] opacity-30 mt-auto pt-4">Powered by CloudBio</p>
        </div>
      </div>
    </div>
  );
}
