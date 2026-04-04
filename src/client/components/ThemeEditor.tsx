import type { Appearance, AppearanceUpdate } from "../hooks/useAppearance";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";
import ImageUploader from "./ImageUploader";

type Props = {
  appearance: Appearance | null;
  onChange: (update: AppearanceUpdate) => void;
};

const BUTTON_STYLES = [
  { value: "rounded", label: "圓角", desc: "12px" },
  { value: "pill", label: "膠囊", desc: "999px" },
  { value: "square", label: "方形", desc: "0px" },
];

const FONTS = [
  "Inter",
  "Noto Sans TC",
  "Poppins",
  "Roboto",
  "Playfair Display",
  "Space Grotesk",
  "DM Sans",
];

const BG_TYPES = [
  { value: "solid", label: "純色" },
  { value: "gradient", label: "漸層" },
  { value: "image", label: "圖片" },
];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

export default function ThemeEditor({ appearance, onChange }: Props) {
  const bgType = appearance?.bgType ?? "solid";
  const bgValue = appearance?.bgValue ?? "#f8f9fa";
  const buttonStyle = appearance?.buttonStyle ?? "rounded";
  const buttonColor = appearance?.buttonColor ?? "#111827";
  const buttonTextColor = appearance?.buttonTextColor ?? "#ffffff";
  const fontFamily = appearance?.fontFamily ?? "Inter";
  const textColor = appearance?.textColor ?? "#111827";
  const profileStyle = appearance?.profileStyle ?? "blend";
  const bgBlur = appearance?.bgBlur ?? false;

  const PROFILE_STYLES = [
    { value: "blend", label: "融入" },
    { value: "card", label: "卡片" },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header Style */}
      <section>
        <Label className="text-sm font-semibold">個人資訊樣式</Label>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {PROFILE_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ profileStyle: s.value })}
              className={cn(
                "py-3 text-sm rounded-lg font-medium transition-colors cursor-pointer",
                profileStyle === s.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Background */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold">背景</Label>
        <div className="flex gap-1.5 mt-3">
          {BG_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onChange({ bgType: t.value })}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer",
                bgType === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {bgType === "solid" && (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgValue.startsWith("#") ? bgValue : "#f8f9fa"}
              onChange={(e) => onChange({ bgValue: e.target.value })}
              className="w-10 h-10 rounded-md border border-input cursor-pointer"
            />
            <Input
              value={bgValue}
              onChange={(e) => onChange({ bgValue: e.target.value })}
              placeholder="#f8f9fa"
              className="flex-1"
            />
          </div>
        )}

        {bgType === "gradient" && (
          <div className="grid grid-cols-3 gap-2">
            {GRADIENT_PRESETS.map((g) => (
              <button
                key={g}
                onClick={() => onChange({ bgValue: g })}
                className={cn(
                  "h-16 rounded-xl transition-all ring-2 cursor-pointer",
                  bgValue === g ? "ring-foreground" : "ring-transparent hover:ring-border"
                )}
                style={{ background: g }}
              />
            ))}
          </div>
        )}

        {bgType === "image" && (
          <ImageUploader
            value={bgValue.startsWith("http") || bgValue.startsWith("/api/img/") ? bgValue : ""}
            onChange={(url) => onChange({ bgValue: url })}
            label="背景圖片"
          />
        )}

        {/* Blur toggle */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">背景模糊</Label>
          <div>
            <Switch checked={bgBlur} onCheckedChange={(v) => onChange({ bgBlur: v })} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Button Style */}
      <section>
        <Label className="text-sm font-semibold">按鈕樣式</Label>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {BUTTON_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ buttonStyle: s.value })}
              className={cn(
                "py-3 text-sm rounded-lg font-medium transition-colors cursor-pointer flex flex-col items-center gap-0.5",
                buttonStyle === s.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <span>{s.label}</span>
              <span className="text-[10px] opacity-60">{s.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Colors */}
      <section>
        <Label className="text-sm font-semibold">顏色</Label>
        <div className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">文字顏色</span>
            <input
              type="color"
              value={textColor}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="w-8 h-8 rounded-md border border-input cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">按鈕背景</span>
            <input
              type="color"
              value={buttonColor}
              onChange={(e) => onChange({ buttonColor: e.target.value })}
              className="w-8 h-8 rounded-md border border-input cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">按鈕文字</span>
            <input
              type="color"
              value={buttonTextColor}
              onChange={(e) => onChange({ buttonTextColor: e.target.value })}
              className="w-8 h-8 rounded-md border border-input cursor-pointer"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Font */}
      <section>
        <Label className="text-sm font-semibold">字體</Label>
        <div className="grid grid-cols-1 gap-1.5 mt-3">
          {FONTS.map((f) => (
            <button
              key={f}
              onClick={() => onChange({ fontFamily: f })}
              className={cn(
                "px-4 py-2.5 text-sm text-left rounded-lg font-medium transition-colors cursor-pointer",
                fontFamily === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
              )}
              style={{ fontFamily: `'${f}', system-ui` }}
            >
              {f}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
