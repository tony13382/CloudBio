import { useRef, useState, useCallback } from "react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { compressImage } from "../lib/compress-image";

type Props = {
  data: Record<string, unknown>;
  update: (k: string, v: unknown) => void;
};

/**
 * Upload a single image file to R2 via /api/upload, returning the public URL.
 * Mirrors the pipeline used by ImageUploader (compress → WebP → POST).
 */
async function uploadImageFile(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const form = new FormData();
  form.append("file", compressed);
  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "same-origin",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "上傳失敗" }));
    throw new Error((err as { error: string }).error || "上傳失敗");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/* ─── Text manipulation helpers (operate on a textarea's current selection) ─── */

type Selection = { start: number; end: number; value: string };

function getSelection(el: HTMLTextAreaElement): Selection {
  return { start: el.selectionStart, end: el.selectionEnd, value: el.value };
}

function applyChange(
  el: HTMLTextAreaElement,
  nextValue: string,
  cursorStart: number,
  cursorEnd: number,
  onChange: (v: string) => void
) {
  onChange(nextValue);
  // Restore selection after React re-renders.
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(cursorStart, cursorEnd);
  });
}

/** Wrap selection with `before`/`after`. If nothing is selected, insert a
 * placeholder between the markers and select it so the user can overwrite. */
function wrapSelection(
  el: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
  onChange: (v: string) => void
) {
  const { start, end, value } = getSelection(el);
  const selected = value.slice(start, end);
  const inner = selected || placeholder;
  const next = value.slice(0, start) + before + inner + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + inner.length;
  applyChange(el, next, cursorStart, cursorEnd, onChange);
}

/** Insert `text` at the current cursor, replacing any selection. */
function insertAt(
  el: HTMLTextAreaElement,
  text: string,
  onChange: (v: string) => void
) {
  const { start, end, value } = getSelection(el);
  const next = value.slice(0, start) + text + value.slice(end);
  const cursor = start + text.length;
  applyChange(el, next, cursor, cursor, onChange);
}

/** Prefix the current line(s) with the given string (for headings, lists, quotes). */
function prefixLines(
  el: HTMLTextAreaElement,
  prefix: string,
  onChange: (v: string) => void
) {
  const { start, end, value } = getSelection(el);
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const sliceEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, sliceEnd);
  const prefixed = block
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line : prefix + line))
    .join("\n");
  const next = value.slice(0, lineStart) + prefixed + value.slice(sliceEnd);
  const delta = prefixed.length - block.length;
  applyChange(el, next, start + prefix.length, end + delta, onChange);
}

/** Insert a block on its own line (e.g. horizontal rule) — ensures a newline
 * before and after so it doesn't collide with surrounding text. */
function insertBlock(
  el: HTMLTextAreaElement,
  text: string,
  onChange: (v: string) => void
) {
  const { start, value } = getSelection(el);
  const needsLeading = start > 0 && value[start - 1] !== "\n";
  const payload = (needsLeading ? "\n" : "") + text + "\n";
  insertAt(el, payload, onChange);
}

/* ─── Toolbar ─── */

export default function MarkdownEditor({ data, update }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const source = String(data.content || "");
  const style = String(data.style || "card");

  const setContent = useCallback(
    (v: string) => update("content", v),
    [update]
  );

  const withTextarea = (fn: (el: HTMLTextAreaElement) => void) => () => {
    const el = textareaRef.current;
    if (el) fn(el);
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const el = textareaRef.current;
    if (!el) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      insertAt(el, `![](${url})`, setContent);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleUpload(file);
          return;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      handleUpload(file);
    }
  };

  const tools = [
    {
      key: "h1",
      icon: <Heading1 className="h-4 w-4" />,
      title: "標題 1",
      onClick: withTextarea((el) => prefixLines(el, "# ", setContent)),
    },
    {
      key: "h2",
      icon: <Heading2 className="h-4 w-4" />,
      title: "標題 2",
      onClick: withTextarea((el) => prefixLines(el, "## ", setContent)),
    },
    {
      key: "bold",
      icon: <Bold className="h-4 w-4" />,
      title: "粗體",
      onClick: withTextarea((el) => wrapSelection(el, "**", "**", "粗體文字", setContent)),
    },
    {
      key: "italic",
      icon: <Italic className="h-4 w-4" />,
      title: "斜體",
      onClick: withTextarea((el) => wrapSelection(el, "*", "*", "斜體文字", setContent)),
    },
    {
      key: "link",
      icon: <LinkIcon className="h-4 w-4" />,
      title: "連結",
      onClick: withTextarea((el) => {
        const url = window.prompt("連結網址", "https://");
        if (!url) return;
        wrapSelection(el, "[", `](${url})`, "連結文字", setContent);
      }),
    },
    {
      key: "quote",
      icon: <Quote className="h-4 w-4" />,
      title: "引用",
      onClick: withTextarea((el) => prefixLines(el, "> ", setContent)),
    },
    {
      key: "ul",
      icon: <List className="h-4 w-4" />,
      title: "無序列表",
      onClick: withTextarea((el) => prefixLines(el, "- ", setContent)),
    },
    {
      key: "ol",
      icon: <ListOrdered className="h-4 w-4" />,
      title: "有序列表",
      onClick: withTextarea((el) => prefixLines(el, "1. ", setContent)),
    },
    {
      key: "hr",
      icon: <Minus className="h-4 w-4" />,
      title: "分隔線",
      onClick: withTextarea((el) => insertBlock(el, "---", setContent)),
    },
    {
      key: "image",
      icon: <ImageIcon className="h-4 w-4" />,
      title: "插入圖片",
      onClick: () => fileInputRef.current?.click(),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>顯示樣式</Label>
        <Tabs value={style} onValueChange={(v) => update("style", v)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="blend">融合</TabsTrigger>
            <TabsTrigger value="card">卡片</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          融合：透明背景、繼承文字顏色。卡片：半透明白色卡片（圓角 20、padding 16）。
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Markdown 內容</Label>
          {uploading && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> 上傳中
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 p-1">
          {tools.map((t, i) => (
            <div key={t.key} className="flex items-center">
              {(i === 2 || i === 5 || i === 9) && (
                <span className="mx-1 h-5 w-px bg-border" aria-hidden />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={t.title}
                onClick={t.onClick}
              >
                {t.icon}
              </Button>
            </div>
          ))}
        </div>

        <Textarea
          ref={textareaRef}
          value={source}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          rows={12}
          placeholder={"# 標題\n\n可以用工具列的按鈕，或直接打 **粗體**、*斜體*、- 列表…\n\n圖片可以貼上、拖曳、或點右上角的圖片按鈕。"}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.85rem",
          }}
        />

        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          支援 GFM 語法。圖片可貼上、拖曳或點工具列上傳（自動壓成 WebP）。
        </p>
      </div>

      {/* Hidden file input for the image toolbar button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
