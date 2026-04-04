export type SocialPlatform = {
  id: string;
  label: string;
  placeholder: string;
  prefix?: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/username" },
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { id: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { id: "x", label: "X (Twitter)", placeholder: "https://x.com/username" },
  { id: "threads", label: "Threads", placeholder: "https://threads.net/@username" },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
  { id: "telegram", label: "Telegram", placeholder: "https://t.me/username" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/886912345678" },
  { id: "line", label: "LINE", placeholder: "https://line.me/ti/p/~userid" },
  { id: "mail", label: "Email", placeholder: "mailto:you@example.com", prefix: "mailto:" },
  { id: "website", label: "個人網站", placeholder: "https://yourwebsite.com" },
];

export type SocialLink = {
  platform: string;
  url: string;
};

export function getPlatform(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.id === id);
}
