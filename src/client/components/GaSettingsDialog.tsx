import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function GaSettingsDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const [gaId, setGaId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && user) {
      setGaId(user.gaId ?? "");
      setError("");
      setSuccess(false);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.patch("/profile", { gaId: gaId.trim() || null });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Google Analytics</DialogTitle>
          <DialogDescription>設定 GA4 Measurement ID，自動追蹤公開頁面流量</DialogDescription>
        </DialogHeader>

        {success ? (
          <DialogBody>
            <p className="text-sm text-green-600 text-center py-4">已儲存</p>
          </DialogBody>
        ) : (
          <form onSubmit={handleSubmit} className="contents">
            <DialogBody className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>Measurement ID</Label>
                <Input
                  value={gaId}
                  onChange={(e) => setGaId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">留空則不啟用追蹤</p>
              </div>
            </DialogBody>
            <DialogFooter className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "儲存中..." : "儲存"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
