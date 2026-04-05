export const BLOCK_TYPES = [
  "button",
  "banner",
  "square",
  "dual_square",
  "video",
  "divider",
  "text",
  "markdown",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type FontSize = "small" | "medium" | "large" | "xlarge";

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "0.875rem",
  medium: "1rem",
  large: "1.25rem",
  xlarge: "1.5rem",
};

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small: "小",
  medium: "中",
  large: "大",
  xlarge: "特大",
};

export const COLOR_PRESETS = [
  "#dc2626", "#f472b6", "#fb7185", "#f97316",
  "#22c55e", "#67e8f9", "#a78bfa", "#92400e",
  "#d4a574", "#171717", "#e5e5e5",
];

export type ButtonConfig = {
  title: string;
  linkType?: "url" | "page";
  url?: string;
  pageSlug?: string;
  subtitle?: string;
  showSubtitle?: boolean;
  imageUrl?: string;
  showImage?: boolean;
  filled?: boolean;
  fontSize?: FontSize;
  animation?: "none" | "pulse" | "bounce" | "shake";
};

export type BannerImage = {
  url: string;
  linkUrl?: string;
  alt?: string;
  label?: string;
  labelColor?: string;
  labelPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  description?: string;
  descriptionAlign?: "left" | "center" | "right";
};

export type BannerConfig = {
  images: BannerImage[];
  autoplay?: boolean;
};

export type SquareConfig = {
  imageUrl: string;
  linkUrl?: string;
  alt?: string;
  label?: string;
  labelColor?: string;
  labelPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  description?: string;
  descriptionAlign?: "left" | "center" | "right";
};

export type DualSquareImage = {
  imageUrl: string;
  linkUrl?: string;
  alt?: string;
  label?: string;
  labelColor?: string;
  labelPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  description?: string;
  descriptionAlign?: "left" | "center" | "right";
};

export type DualSquareConfig = {
  images: DualSquareImage[];
};

export type VideoConfig = { youtubeUrl: string };

export type DividerConfig = { style?: "solid" | "dashed" | "dotted" | "blank" };

export type TextConfig = {
  content: string;
  variant?: "heading" | "paragraph";
  fontSize?: FontSize;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
};

export type MarkdownConfig = {
  content: string;
  style?: "blend" | "card";
};

export type BlockConfig =
  | ButtonConfig
  | BannerConfig
  | SquareConfig
  | DualSquareConfig
  | VideoConfig
  | DividerConfig
  | TextConfig
  | MarkdownConfig;

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  button: "文字按鈕",
  banner: "橫幅看板",
  square: "方形看板",
  dual_square: "雙方格看板",
  video: "影片播放器",
  divider: "分隔線",
  text: "文字",
  markdown: "Markdown 卡片",
};

export function getDefaultConfig(type: BlockType): BlockConfig {
  switch (type) {
    case "button":
      return { title: "", linkType: "url", url: "", filled: true, showSubtitle: false, showImage: false, fontSize: "medium", animation: "none" };
    case "banner":
      return { images: [], autoplay: false };
    case "square":
      return { imageUrl: "" };
    case "dual_square":
      return { images: [{ imageUrl: "" }, { imageUrl: "" }] };
    case "video":
      return { youtubeUrl: "" };
    case "divider":
      return { style: "solid" };
    case "text":
      return { content: "", variant: "paragraph", fontSize: "medium", align: "center" };
    case "markdown":
      return { content: "", style: "card" };
  }
}
