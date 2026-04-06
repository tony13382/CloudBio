import { useState, useEffect, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api";
import { compressImage } from "../lib/compress-image";
import type { SocialLink } from "../../lib/social-platforms";
import SocialLinksEditor from "./SocialLinksEditor";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Camera, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ProfileEditor({ open, onClose }: Props) {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  useEffect(() => {
    if (user && open) {
      setDisplayName(user.displayName ?? "");
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
      setError("");
      try {
        setSocialLinks(user.socialLinks ? JSON.parse(user.socialLinks) : []);
      } catch {
        setSocialLinks([]);
      }
    }
  }, [user, open]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedBlob = (src: string, area: Area): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = area.width;
        canvas.height = area.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("裁切失敗"))), "image/jpeg", 0.95);
      };
      img.onerror = () => reject(new Error("圖片載入失敗"));
      img.src = src;
    });

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setAvatarUploading(true);
    setError("");
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const compressed = await compressImage(croppedFile, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
      });
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
      setAvatarUrl(data.url);
      setCropSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "大頭照上傳失敗");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.patch("/profile", {
        displayName,
        bio,
        avatarUrl,
        socialLinks: socialLinks.filter((l) => l.url.trim() !== ""),
      });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  const initial = (displayName || user?.username || "U").charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯個人檔案</DialogTitle>
          <DialogDescription className="sr-only">編輯你的個人資訊和社群連結</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="大頭照" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {avatarUploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">點擊更換大頭照</p>
          </div>

          {/* Crop UI */}
          {cropSrc && (
            <div className="space-y-3">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground shrink-0">縮放</span>
                <Slider
                  min={1}
                  max={3}
                  step={0.05}
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setCropSrc(null)}>
                  取消
                </Button>
                <Button type="button" size="sm" disabled={avatarUploading} onClick={handleCropConfirm}>
                  {avatarUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />上傳中...</> : "確認裁切"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pe-displayName">顯示名稱</Label>
            <Input
              id="pe-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="你的名稱"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pe-bio">個人簡介</Label>
            <Textarea
              id="pe-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="介紹一下你自己"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/500</p>
          </div>

          <Separator />

          <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading || avatarUploading}>
              {loading ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
