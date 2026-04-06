import { useState } from "react";
import type { Page } from "../hooks/usePages";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Plus, Pencil, Trash2, Home } from "lucide-react";

type Props = {
  pages: Page[];
  activePageId: string | null;
  onSelect: (pageId: string) => void;
  onCreate: (slug: string, title: string | null) => Promise<void>;
  onUpdate: (
    id: string,
    payload: { slug?: string; title?: string | null },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function PageTabs({
  pages,
  activePageId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Page | null>(null);

  return (
    <>
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6"
        style={{ scrollbarWidth: "none" }}
      >
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          const label = page.isDefault ? "主頁" : page.title || `/${page.slug}`;
          return (
            <button
              key={page.id}
              onClick={() => onSelect(page.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {page.isDefault && <Home className="h-3.5 w-3.5" />}
              <span className="max-w-[140px] truncate">{label}</span>
              {!page.isDefault && isActive && (
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-1 opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTarget(page);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setEditTarget(page);
                    }
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-8 rounded-full px-3"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          新增頁面
        </Button>
      </div>

      <CreatePageDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (slug, title) => {
          await onCreate(slug, title);
          setCreateOpen(false);
        }}
      />

      {editTarget && (
        <EditPageDialog
          page={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={async (slug, title) => {
            await onUpdate(editTarget.id, { slug, title });
            setEditTarget(null);
          }}
          onDelete={async () => {
            await onDelete(editTarget.id);
            setEditTarget(null);
          }}
        />
      )}
    </>
  );
}

function CreatePageDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (slug: string, title: string | null) => Promise<void>;
}) {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(slug.trim().toLowerCase(), title.trim() || null);
      setSlug("");
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>新增頁面</DialogTitle>
          <DialogDescription>
            建立一個子頁，可從主頁或其他頁面連結過去。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-slug">網址 slug</Label>
              <Input
                id="page-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="shop"
                pattern="[a-z0-9][a-z0-9-]{0,39}"
                required
              />
              <p className="text-xs text-muted-foreground">
                限小寫英數與 -，1-40 字
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-title">頁面標題（顯示在 header）</Label>
              <Input
                id="page-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="商店"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </DialogBody>
          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !slug.trim()}>
              {loading ? "建立中..." : "建立"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPageDialog({
  page,
  onClose,
  onSubmit,
  onDelete,
}: {
  page: Page;
  onClose: () => void;
  onSubmit: (slug: string, title: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [slug, setSlug] = useState(page.slug);
  const [title, setTitle] = useState(page.title ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(slug.trim().toLowerCase(), title.trim() || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `確定要刪除頁面 "${page.title || page.slug}"？裡面的區塊都會一起被刪除。`,
      )
    )
      return;
    setLoading(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>編輯頁面</DialogTitle>
          <DialogDescription>修改頁面網址或標題。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-slug">網址 slug</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                pattern="[a-z0-9][a-z0-9-]{0,39}"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">頁面標題</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <div className="flex justify-between gap-2 w-full">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
                刪除
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
