import { useState, useEffect } from "react";
import type { BlockType, FontSize, BannerImage, DualSquareImage } from "../../lib/block-types";
import { FONT_SIZE_LABELS, COLOR_PRESETS, BLOCK_TYPE_LABELS } from "../../lib/block-types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import ImageUploader from "./ImageUploader";

type Props = {
  open: boolean;
  type: BlockType;
  config: Record<string, unknown>;
  isActive?: boolean;
  onSave: (config: Record<string, unknown>) => Promise<void>;
  onToggleActive?: () => void;
  onDelete?: () => void;
  onClose: () => void;
};

export default function BlockEditor({ open, type, config, isActive, onSave, onToggleActive, onDelete, onClose }: Props) {
  const [data, setData] = useState(config);
  const [loading, setLoading] = useState(false);

  // Reset data when config changes (opening a different block)
  useEffect(() => {
    setData(config);
  }, [config]);

  const update = (key: string, value: unknown) => setData({ ...data, [key]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯{BLOCK_TYPE_LABELS[type]}</DialogTitle>
          <DialogDescription className="sr-only">編輯區塊設定</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "button" && <ButtonEditor data={data} update={update} />}
          {type === "banner" && <BannerEditor data={data} update={update} />}
          {type === "square" && <SquareEditor data={data} update={update} />}
          {type === "dual_square" && <DualSquareEditor data={data} update={update} />}
          {type === "video" && (
            <div className="space-y-2">
              <Label>YouTube 網址</Label>
              <Input
                type="url"
                required
                value={String(data.youtubeUrl || "")}
                onChange={(e) => update("youtubeUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          )}
          {type === "divider" && (
            <div className="space-y-2">
              <Label>分隔線樣式</Label>
              <Select value={String(data.style || "solid")} onValueChange={(v) => update("style", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">實線</SelectItem>
                  <SelectItem value="dashed">虛線</SelectItem>
                  <SelectItem value="dotted">點線</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {type === "text" && <TextEditor data={data} update={update} />}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {onToggleActive && (
                <Button type="button" variant="ghost" size="sm" onClick={onToggleActive}
                  className={isActive ? "text-green-600" : "text-muted-foreground"}>
                  {isActive ? <Eye className="h-4 w-4 mr-1.5" /> : <EyeOff className="h-4 w-4 mr-1.5" />}
                  {isActive ? "已啟用" : "已停用"}
                </Button>
              )}
              {onDelete && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  刪除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "儲存中..." : "儲存"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Shared Components ─── */

function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function FontSizeSelector({ value, onChange }: { value: FontSize; onChange: (v: FontSize) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as FontSize)}>
      <TabsList className="w-full">
        {(["small", "medium", "large", "xlarge"] as FontSize[]).map((s) => (
          <TabsTrigger key={s} value={s} className="flex-1">
            {FONT_SIZE_LABELS[s]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
            value === c ? "border-foreground scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="h-7 w-7 rounded-full border-2 border-dashed border-border cursor-pointer overflow-hidden relative hover:border-muted-foreground transition-colors">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <span className="w-full h-full block rounded-full" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
      </label>
    </div>
  );
}

function AlignSelector({ value, onChange }: { value: "left" | "center" | "right"; onChange: (v: "left" | "center" | "right") => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as "left" | "center" | "right")}>
      <TabsList className="w-full">
        <TabsTrigger value="left" className="flex-1">置左對齊</TabsTrigger>
        <TabsTrigger value="center" className="flex-1">置中對齊</TabsTrigger>
        <TabsTrigger value="right" className="flex-1">置右對齊</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function LabelPositionSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="w-full">
        <TabsTrigger value="top-left" className="flex-1">左上</TabsTrigger>
        <TabsTrigger value="top-right" className="flex-1">右上</TabsTrigger>
        <TabsTrigger value="bottom-left" className="flex-1">左下</TabsTrigger>
        <TabsTrigger value="bottom-right" className="flex-1">右下</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

/* ─── Image Card Editor ─── */

function ImageCardEditor({
  image,
  onChange,
  onRemove,
  index,
  urlField,
  recommendedSize,
  aspectRatio,
}: {
  image: Record<string, unknown>;
  onChange: (updated: Record<string, unknown>) => void;
  onRemove: () => void;
  index: number;
  urlField: string;
  recommendedSize: string;
  aspectRatio?: number;
}) {
  const upd = (key: string, value: unknown) => onChange({ ...image, [key]: value });
  const imgUrl = String(image[urlField] || "");

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">圖片 {index + 1}</span>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>連結網址</Label>
        <Input
          type="url"
          value={String(image.linkUrl || "")}
          onChange={(e) => upd("linkUrl", e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <ImageUploader
        value={imgUrl}
        onChange={(v) => upd(urlField, v)}
        label="圖片"
        recommendedSize={recommendedSize}
        aspectRatio={aspectRatio}
      />

      {imgUrl && (
        <div className="space-y-2">
          <Label>圖片描述 (SEO)</Label>
          <Input
            value={String(image.alt || "")}
            onChange={(e) => upd("alt", e.target.value)}
            placeholder="(選填) 照片描述，有助 SEO"
            className="text-xs"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>標籤文字</Label>
        <div className="flex gap-2">
          <Input
            value={String(image.label || "")}
            onChange={(e) => upd("label", e.target.value)}
            placeholder="標籤文字"
            className="flex-1"
          />
          <input
            type="color"
            value={String(image.labelColor || "#000000")}
            onChange={(e) => upd("labelColor", e.target.value)}
            className="w-9 h-9 rounded-md border border-input cursor-pointer shrink-0"
          />
        </div>
      </div>

      {String(image.label || "") !== "" && (
        <LabelPositionSelector
          value={String(image.labelPosition || "top-left")}
          onChange={(v) => upd("labelPosition", v)}
        />
      )}

      <div className="space-y-2">
        <Label>簡介文字</Label>
        <Input
          value={String(image.description || "")}
          onChange={(e) => upd("description", e.target.value)}
          placeholder="簡介文字"
        />
      </div>

      {String(image.description || "") !== "" && (
        <AlignSelector
          value={(image.descriptionAlign as "left" | "center" | "right") || "center"}
          onChange={(v) => upd("descriptionAlign", v)}
        />
      )}
    </Card>
  );
}

/* ─── Button Editor ─── */

function ButtonEditor({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <SwitchField label="按鈕填滿" checked={data.filled !== false} onChange={(v) => update("filled", v)} />
      <SwitchField label="按鈕圖片" checked={!!data.showImage} onChange={(v) => update("showImage", v)} />
      <SwitchField label="按鈕副標" checked={!!data.showSubtitle} onChange={(v) => update("showSubtitle", v)} />

      <div className="space-y-2">
        <Label>字體大小</Label>
        <FontSizeSelector
          value={(data.fontSize as FontSize) || "medium"}
          onChange={(v) => update("fontSize", v)}
        />
      </div>

      <div className="space-y-2">
        <Label>標題</Label>
        <Input
          required
          value={String(data.title || "")}
          onChange={(e) => update("title", e.target.value)}
          placeholder="我的網站"
        />
      </div>

      {!!data.showSubtitle && (
        <div className="space-y-2">
          <Label>副標題</Label>
          <Input
            value={String(data.subtitle || "")}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="描述文字..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>網址</Label>
        <Input
          type="url"
          required
          value={String(data.url || "")}
          onChange={(e) => update("url", e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label>動態效果</Label>
        <Select value={String(data.animation || "none")} onValueChange={(v) => update("animation", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">無動態效果</SelectItem>
            <SelectItem value="pulse">脈動</SelectItem>
            <SelectItem value="bounce">彈跳</SelectItem>
            <SelectItem value="shake">搖晃</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!!data.showImage && (
        <ImageUploader
          value={String(data.imageUrl || "")}
          onChange={(v) => update("imageUrl", v)}
          label="按鈕圖片"
          recommendedSize="320 x 320"
          aspectRatio={1}
        />
      )}
    </div>
  );
}

/* ─── Banner Editor ─── */

function BannerEditor({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const images = (data.images as BannerImage[]) || [];

  const updateImage = (index: number, updated: Record<string, unknown>) => {
    const newImages = [...images];
    newImages[index] = updated as BannerImage;
    update("images", newImages);
  };

  const removeImage = (index: number) => {
    update("images", images.filter((_, i) => i !== index));
  };

  const addImage = () => {
    update("images", [...images, { url: "", linkUrl: "", alt: "" }]);
  };

  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <ImageCardEditor
          key={i}
          image={img as unknown as Record<string, unknown>}
          onChange={(updated) => updateImage(i, updated)}
          onRemove={() => removeImage(i)}
          index={i}
          urlField="url"
          recommendedSize="640 x 360"
          aspectRatio={16 / 9}
        />
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={addImage}>
        <Plus className="h-4 w-4" />
        新增圖片
      </Button>
    </div>
  );
}

/* ─── Square Editor ─── */

function SquareEditor({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <ImageCardEditor
      image={data}
      onChange={(updated) => {
        Object.entries(updated).forEach(([k, v]) => update(k, v));
      }}
      onRemove={() => {
        update("imageUrl", "");
        update("linkUrl", "");
        update("alt", "");
        update("label", "");
        update("description", "");
      }}
      index={0}
      urlField="imageUrl"
      recommendedSize="640 x 640"
      aspectRatio={1}
    />
  );
}

/* ─── Dual Square Editor ─── */

function DualSquareEditor({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  const images = (data.images as DualSquareImage[]) || [{ imageUrl: "" }, { imageUrl: "" }];
  while (images.length < 2) images.push({ imageUrl: "" });

  const updateImage = (index: number, updated: Record<string, unknown>) => {
    const newImages = [...images];
    newImages[index] = updated as DualSquareImage;
    update("images", newImages);
  };

  return (
    <div className="space-y-3">
      {images.slice(0, 2).map((img, i) => (
        <ImageCardEditor
          key={i}
          image={img as unknown as Record<string, unknown>}
          onChange={(updated) => updateImage(i, updated)}
          onRemove={() => updateImage(i, { imageUrl: "" })}
          index={i}
          urlField="imageUrl"
          recommendedSize="640 x 640"
          aspectRatio={1}
        />
      ))}
    </div>
  );
}

/* ─── Text Editor ─── */

function TextEditor({ data, update }: { data: Record<string, unknown>; update: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <Tabs value={String(data.variant || "paragraph")} onValueChange={(v) => update("variant", v)}>
        <TabsList className="w-full">
          <TabsTrigger value="heading" className="flex-1">標題</TabsTrigger>
          <TabsTrigger value="paragraph" className="flex-1">段落</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label>文字內容</Label>
        <Textarea
          required
          value={String(data.content || "")}
          onChange={(e) => update("content", e.target.value)}
          rows={3}
          placeholder="輸入文字..."
        />
      </div>

      <div className="space-y-2">
        <Label>顏色</Label>
        <ColorPicker
          value={String(data.color || "#000000")}
          onChange={(v) => update("color", v)}
        />
      </div>

      <div className="space-y-2">
        <Label>字體大小</Label>
        <FontSizeSelector
          value={(data.fontSize as FontSize) || "medium"}
          onChange={(v) => update("fontSize", v)}
        />
      </div>

      <Tabs
        value={[
          data.bold && "bold",
          data.italic && "italic",
          data.underline && "underline",
        ].filter(Boolean).join(",") || "none"}
      >
        <TabsList className="w-full">
          {([
            { key: "bold", label: "粗體" },
            { key: "italic", label: "斜體" },
            { key: "underline", label: "下底線" },
          ] as const).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => update(s.key, !data[s.key])}
              className={cn(
                "flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all cursor-pointer",
                data[s.key]
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label>對齊</Label>
        <AlignSelector
          value={(data.align as "left" | "center" | "right") || "center"}
          onChange={(v) => update("align", v)}
        />
      </div>
    </div>
  );
}
