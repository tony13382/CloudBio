import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style}>
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
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{link.title}</p>
        <p className="text-sm text-gray-400 truncate">{link.url}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {/* Toggle active */}
        <button
          onClick={() => onUpdate(link.id, { isActive: !link.isActive })}
          className={`p-1.5 rounded-lg transition ${
            link.isActive ? "text-green-500 hover:bg-green-50" : "text-gray-300 hover:bg-gray-50"
          }`}
          title={link.isActive ? "停用" : "啟用"}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="6" />
          </svg>
        </button>

        {/* Edit */}
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(link.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function LinkList({ links, onUpdate, onDelete, onReorder, onMutate }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
