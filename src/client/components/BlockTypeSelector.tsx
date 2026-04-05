import { BLOCK_TYPES, BLOCK_TYPE_LABELS, type BlockType } from "../../lib/block-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Type,
  Image,
  Square,
  LayoutGrid,
  Play,
  Minus,
  FileText,
  FileCode,
} from "lucide-react";

type Props = {
  open: boolean;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
};

const ICONS: Record<BlockType, React.ReactNode> = {
  button: <Type className="h-6 w-6" />,
  banner: <Image className="h-6 w-6" />,
  square: <Square className="h-6 w-6" />,
  dual_square: <LayoutGrid className="h-6 w-6" />,
  video: <Play className="h-6 w-6" />,
  divider: <Minus className="h-6 w-6" />,
  text: <FileText className="h-6 w-6" />,
  markdown: <FileCode className="h-6 w-6" />,
};

export default function BlockTypeSelector({ open, onSelect, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>新增區塊</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-accent transition-colors cursor-pointer"
            >
              <span className="text-muted-foreground">{ICONS[type]}</span>
              <span className="text-xs font-medium">{BLOCK_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
