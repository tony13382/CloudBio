import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { compressImage } from "../lib/compress-image";
import ImageCropper from "./ImageCropper";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  recommendedSize?: string;
  /** Aspect ratio for cropping (e.g. 1 for 1:1, 16/9 for 16:9). If omitted, no cropping. */
  aspectRatio?: number;
};

export default function ImageUploader({ value, onChange, label = "圖片", recommendedSize, aspectRatio }: Props) {
  const [mode, setMode] = useState<"upload" | "url">(value && value.startsWith("http") && !value.startsWith("/api/img/") ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadBlob = async (blob: Blob, fileName: string) => {
    setUploading(true);
    setError("");
    try {
      const file = new File([blob], fileName, { type: blob.type });
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "上傳失敗" }));
        throw new Error((err as { error: string }).error);
      }

      const data = await res.json() as { url: string };
      onChange(data.url);
      setPreview(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("請選擇圖片檔案");
      return;
    }
    setError("");

    const objectUrl = URL.createObjectURL(file);

    if (aspectRatio) {
      // Show cropper first
      setCropSrc(objectUrl);
    } else {
      // Upload directly
      setPreview(objectUrl);
      await uploadBlob(file, file.name);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropSrc(null);
    setPreview(URL.createObjectURL(croppedBlob));
    await uploadBlob(croppedBlob, "cropped.webp");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const displayUrl = value || preview;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "upload" | "url")}>
        <TabsList className="w-full">
          <TabsTrigger value="upload" className="flex-1 gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            上傳圖片
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1 gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            輸入網址
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "upload" ? (
        <div
          className="relative border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-muted-foreground transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">壓縮上傳中...</p>
            </div>
          ) : displayUrl ? (
            <div className="flex items-center gap-3">
              <img src={displayUrl} alt="" className="w-16 h-16 rounded-lg object-cover border" />
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">點擊更換圖片</p>
                {recommendedSize && (
                  <p className="text-[10px] text-muted-foreground/60">建議尺寸：{recommendedSize}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                  setPreview(null);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                拖曳或點擊上傳圖片
              </p>
              {recommendedSize && (
                <p className="text-[10px] text-muted-foreground/60">建議尺寸：{recommendedSize}</p>
              )}
              <p className="text-[10px] text-muted-foreground/60">
                JPG, PNG, WebP, GIF（最大 5MB，自動壓縮為 WebP）
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          {value && (
            <div className="flex items-center gap-3">
              <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover border" />
              {recommendedSize && (
                <p className="text-[10px] text-muted-foreground">建議尺寸：{recommendedSize}</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Crop dialog */}
      {aspectRatio && cropSrc && (
        <ImageCropper
          open={!!cropSrc}
          imageSrc={cropSrc}
          aspectRatio={aspectRatio}
          onComplete={handleCropComplete}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
