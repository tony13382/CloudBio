import { useState, useEffect, useRef } from "react";
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

export default function ChangeUsernameDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open && user) {
      setUsername(user.username);
      setError("");
      setAvailable(null);
      setSuccess(false);
    }
  }, [open, user]);

  const checkUsername = (value: string) => {
    clearTimeout(timerRef.current);
    setAvailable(null);
    setError("");

    if (value === user?.username) {
      return;
    }
    if (value.length < 3) {
      setError("至少需要 3 個字元");
      return;
    }

    setChecking(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean; reason?: string }>(
          `/profile/check-username/${encodeURIComponent(value)}`
        );
        setAvailable(res.available);
        if (!res.available && res.reason) {
          setError(res.reason);
        }
      } catch {
        setError("檢查失敗");
      } finally {
        setChecking(false);
      }
    }, 400);
  };

  const handleChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(normalized);
    checkUsername(normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === user?.username) {
      onClose();
      return;
    }
    if (available === false) return;

    setError("");
    setLoading(true);
    try {
      await api.patch("/profile", { username });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = username.length >= 3 && available !== false && !checking && !loading;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>修改使用者名稱</DialogTitle>
          <DialogDescription>變更後，你的公開頁面網址也會跟著改變</DialogDescription>
        </DialogHeader>

        {success ? (
          <DialogBody>
            <p className="text-sm text-green-600 text-center py-4">使用者名稱已更新</p>
          </DialogBody>
        ) : (
          <form onSubmit={handleSubmit} className="contents">
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label>使用者名稱</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/</span>
                  <Input
                    value={username}
                    onChange={(e) => handleChange(e.target.value)}
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </div>
                {checking && (
                  <p className="text-xs text-muted-foreground">檢查中...</p>
                )}
                {!checking && error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
                {!checking && available === true && username !== user?.username && (
                  <p className="text-xs text-green-600">此名稱可以使用</p>
                )}
              </div>
            </DialogBody>
            <DialogFooter className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {loading ? "更新中..." : "確認修改"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
