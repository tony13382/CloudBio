import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "../hooks/useBlocks";
import { parseConfig } from "../hooks/useBlocks";
import type { Appearance } from "../hooks/useAppearance";
import { FONT_SIZE_MAP, type FontSize, type BlockType } from "../../lib/block-types";
import BlockEditor from "./BlockEditor";
import { renderMarkdown } from "../../lib/markdown";

type Props = {
  blocks: Block[];
  appearance: Appearance | null;
  onUpdate: (id: string, data: { config?: Record<string, unknown>; isActive?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, newSortOrder: number) => Promise<void>;
  onMutate: () => void;
};

function resolveFontSize(key: string): string {
  return FONT_SIZE_MAP[key as FontSize] || "1rem";
}

function getButtonRadius(style: string): string {
  switch (style) {
    case "pill": return "9999px";
    case "square": return "0";
    default: return "12px";
  }
}

/* ─── Block Preview ─── */

function BlockPreview({ block, appearance }: { block: Block; appearance: Appearance | null }) {
  const c = parseConfig(block);
  const buttonColor = appearance?.buttonColor ?? "#111827";
  const buttonTextColor = appearance?.buttonTextColor ?? "#ffffff";
  const buttonStyle = appearance?.buttonStyle ?? "rounded";
  const textColor = appearance?.textColor ?? "#111827";

  switch (block.type) {
    case "button": {
      const title = String(c.title || "未命名按鈕");
      const subtitle = c.showSubtitle && c.subtitle ? String(c.subtitle) : "";
      const imageUrl = c.showImage && c.imageUrl ? String(c.imageUrl) : "";
      const filled = c.filled !== false;
      const fontSize = resolveFontSize(String(c.fontSize || "medium"));
      return (
        <div
          className="w-full py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2.5"
          style={{
            background: filled ? buttonColor : "transparent",
            color: filled ? buttonTextColor : buttonColor,
            border: filled ? "none" : `2px solid ${buttonColor}`,
            borderRadius: getButtonRadius(buttonStyle),
            fontSize,
          }}
        >
          {imageUrl && <img src={imageUrl} alt="" className="w-7 h-7 rounded object-cover shrink-0" />}
          <span className="flex flex-col items-center gap-0.5">
            <span className="truncate">{title}</span>
            {subtitle && <span className="text-xs opacity-70 truncate">{subtitle}</span>}
          </span>
        </div>
      );
    }
    case "banner": {
      const images = (c.images as { url: string; alt?: string }[]) || [];
      if (!images.length) return <div className="h-20 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">橫幅看板（無圖片）</div>;
      return (
        <div className="flex gap-2 overflow-x-auto rounded-lg" style={{ scrollbarWidth: "none" }}>
          {images.map((img, i) => <img key={i} src={img.url} alt={img.alt || ""} className="h-24 w-auto rounded-lg object-cover shrink-0" />)}
        </div>
      );
    }
    case "square": {
      const imgUrl = String(c.imageUrl || "");
      if (!imgUrl) return <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">方形看板</div>;
      return <img src={imgUrl} alt="" className="w-full aspect-square rounded-lg object-cover" />;
    }
    case "dual_square": {
      const images = (c.images as { imageUrl: string }[]) || [];
      return (
        <div className="flex gap-2">
          {images.slice(0, 2).map((img, i) => img.imageUrl
            ? <img key={i} src={img.imageUrl} alt="" className="flex-1 min-w-0 aspect-square rounded-lg object-cover" />
            : <div key={i} className="flex-1 min-w-0 aspect-square rounded-lg bg-muted" />
          )}
        </div>
      );
    }
    case "video": {
      const match = String(c.youtubeUrl || "").match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (!match) return <div className="h-20 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">YouTube 影片</div>;
      return (
        <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <img src={`https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>
      );
    }
    case "divider": {
      const style = String(c.style || "solid");
      if (style === "blank") {
        return <div className="h-6 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center text-[10px] text-muted-foreground/50">空白</div>;
      }
      return <hr className="my-1 border-0" style={{ borderTop: `1px ${style} ${textColor}`, opacity: 0.2 }} />;
    }
    case "markdown": {
      const source = String(c.content || "");
      if (!source) return <p className="text-sm text-muted-foreground italic">Markdown 卡片（尚未填寫）</p>;
      const mdStyle = String(c.style || "card");
      const wrapper: React.CSSProperties = mdStyle === "card"
        ? {
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 20,
            padding: "20px 28px",
            color: "#111827",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            lineHeight: 1.5,
          }
        : { background: "transparent", padding: 0, color: textColor, lineHeight: 1.5 };
      return (
        <div
          className={`markdown-body markdown-${mdStyle} text-sm`}
          style={wrapper}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
        />
      );
    }
    case "text": {
      const variant = String(c.variant || "paragraph");
      const baseFontSize = resolveFontSize(String(c.fontSize || "medium"));
      return (
        <p className="m-0" style={{
          fontSize: variant === "heading" ? `calc(${baseFontSize} * 1.2)` : baseFontSize,
          color: (c.color as string) || textColor,
          fontWeight: c.bold || variant === "heading" ? 700 : undefined,
          fontStyle: c.italic ? "italic" : undefined,
          textDecoration: c.underline ? "underline" : undefined,
          textAlign: (c.align as "left" | "center" | "right") || "center",
          marginTop: variant === "heading" ? 16 : 0,
        }}>
          {String(c.content || "文字區塊")}
        </p>
      );
    }
    default: return <p className="text-sm text-muted-foreground">{block.type}</p>;
  }
}

/* ─── Drag Overlay Item ─── */

function DragOverlayItem({ block, appearance }: { block: Block; appearance: Appearance | null }) {
  return (
    <div className="bg-background/90 backdrop-blur rounded-lg shadow-lg ring-2 ring-primary/20 p-1.5 max-w-2xl">
      <BlockPreview block={block} appearance={appearance} />
    </div>
  );
}

/* ─── Sortable Item ─── */

function SortableItem({
  block,
  appearance,
  onUpdate,
  onDelete,
}: {
  block: Block;
  appearance: Appearance | null;
  onUpdate: Props["onUpdate"];
  onDelete: Props["onDelete"];
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const pointerDownTime = useRef(0);

  const handlePointerDown = useCallback(() => {
    pointerDownTime.current = Date.now();
  }, []);

  const handleClick = useCallback(() => {
    if (Date.now() - pointerDownTime.current < 300) {
      setEditing(true);
    }
  }, []);

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
          opacity: isDragging ? 0.25 : 1,
        }}
        className={`relative rounded-lg p-1.5 select-none touch-manipulation cursor-pointer transition-all ${isDragging ? "shadow-lg ring-2 ring-primary/20" : ""} ${!block.isActive ? "opacity-40" : ""}`}
        {...attributes}
        {...listeners}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <BlockPreview block={block} appearance={appearance} />
      </div>

      <BlockEditor
        open={editing}
        type={block.type as BlockType}
        config={parseConfig(block)}
        isActive={block.isActive ?? true}
        onSave={async (config) => { await onUpdate(block.id, { config }); setEditing(false); }}
        onToggleActive={() => onUpdate(block.id, { isActive: !block.isActive })}
        onDelete={async () => { await onDelete(block.id); setEditing(false); }}
        onClose={() => setEditing(false)}
      />
    </>
  );
}

/* ─── Block List ─── */

export default function BlockList({ blocks, appearance, onUpdate, onDelete, onReorder, onMutate }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(blocks, oldIndex, newIndex);
    const movedIdx = reordered.findIndex((b) => b.id === active.id);

    let newSortOrder: number;
    if (movedIdx === 0) {
      newSortOrder = (reordered[1]?.sortOrder ?? 1) - 1;
    } else if (movedIdx === reordered.length - 1) {
      newSortOrder = (reordered[reordered.length - 2]?.sortOrder ?? 0) + 1;
    } else {
      newSortOrder = (reordered[movedIdx - 1].sortOrder + reordered[movedIdx + 1].sortOrder) / 2;
    }

    await onReorder(active.id as string, newSortOrder);
    onMutate();
  };

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  if (!blocks.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">還沒有任何區塊</p>
        <p className="text-sm mt-1">點擊上方按鈕新增第一個區塊</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {blocks.map((block) => (
            <SortableItem key={block.id} block={block} appearance={appearance} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeBlock ? <DragOverlayItem block={activeBlock} appearance={appearance} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
