import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api";
import { compressImage } from "../lib/compress-image";
import type { SocialLink } from "../../lib/social-platforms";
import DashboardLayout from "../components/DashboardLayout";
import SocialLinksEditor from "../components/SocialLinksEditor";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Camera, Loader2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
      try {
        setSocialLinks(user.socialLinks ? JSON.parse(user.socialLinks) : []);
      } catch {
        setSocialLinks([]);
      }
    }
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setAvatarUploading(true);
    setError("");
    try {
      const compressed = await compressImage(file, {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "大頭照上傳失敗");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.patch("/profile", {
        displayName,
        bio,
        avatarUrl,
        socialLinks: socialLinks.filter((l) => l.url.trim() !== ""),
      });
      setMessage("已儲存");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  const initial = (displayName || user?.username || "U").charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>帳號設定</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">
                  {message}
                </div>
              )}

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="大頭照"
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                      {initial}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    {avatarUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">點擊更換大頭照</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">顯示名稱</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的名稱"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">個人簡介</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="介紹一下你自己"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">{bio.length}/500</p>
              </div>

              <Separator />

              {/* Social Links */}
              <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />

              <Button type="submit" className="w-full" disabled={loading || avatarUploading}>
                {loading ? "儲存中..." : "儲存變更"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
