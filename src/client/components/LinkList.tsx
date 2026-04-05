import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Link } from "../hooks/useLinks";
import LinkForm from "./LinkForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Separator } from "./ui/separator";

type Props = {
  links: Link[];
  onUpdate: (id: string, data: Partial<Pick<Link, "title" | "url" | "isActive">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, newSortOrder: number) => Promise<void>;
  onMutate: () => void;
};

function SortableItem({
  link,
  onUpdate,
  onDelete,
}: {
  link: Link;
  onUpdate: Props["onUpdate"];
  onDelete: Props["onDelete"];
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });
  const pointerDownTime = useRef(0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handlePointerDown = useCallback(() => {
    pointerDownTime.current = Date.now();
  }, []);

  const handleClick = useCallback(() => {
    // Only open edit if it was a short press (not a drag)
    if (Date.now() - pointerDownTime.current < 300) {
      setEditing(true);
    }
  }, []);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 select-none touch-manipulation ${isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
        {...attributes}
        {...listeners}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${link.isActive ? "bg-green-500" : "bg-gray-300"}`}
            />
            <p className="font-medium text-gray-900 truncate">{link.title}</p>
          </div>
          <p className="text-sm text-gray-400 truncate ml-4">{link.url}</p>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={(v) => !v && setEditing(false)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯連結</DialogTitle>
            <DialogDescription className="sr-only">編輯連結設定</DialogDescription>
          </DialogHeader>

          <LinkForm
            initialTitle={link.title}
            initialUrl={link.url}
            submitLabel="儲存"
            onSubmit={async (title, url) => {
              await onUpdate(link.id, { title, url });
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />

          <Separator />

          <div className="flex items-center justify-between">
            <button
              onClick={() => onUpdate(link.id, { isActive: !link.isActive })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                link.isActive
                  ? "text-green-600 hover:bg-green-50"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="6" />
              </svg>
              {link.isActive ? "已啟用" : "已停用"}
            </button>

            <button
              onClick={async () => {
                await onDelete(link.id);
                setEditing(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              刪除連結
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LinkList({ links, onUpdate, onDelete, onReorder, onMutate }: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);

    // Calculate new fractional sortOrder
    let newSortOrder: number;
    if (newIndex === 0) {
      newSortOrder = links[0].sortOrder - 1;
    } else if (newIndex === links.length - 1) {
      newSortOrder = links[links.length - 1].sortOrder + 1;
    } else {
      const before = newIndex > oldIndex ? links[newIndex] : links[newIndex - 1];
      const after = newIndex > oldIndex ? links[newIndex + 1] : links[newIndex];
      newSortOrder = (before.sortOrder + after.sortOrder) / 2;
    }

    await onReorder(active.id as string, newSortOrder);
    onMutate();
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">還沒有任何連結</p>
        <p className="text-sm mt-1">點擊上方按鈕新增第一個連結</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {links.map((link) => (
            <SortableItem
              key={link.id}
              link={link}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
