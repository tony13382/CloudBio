import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  open: boolean;
  imageSrc: string;
  aspectRatio: number;
  onComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
};

export default function ImageCropper({ open, imageSrc, aspectRatio, onComplete, onClose }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedArea);
      onComplete(blob);
    } finally {
      setProcessing(false);
    }
  };

  const ratioLabel = aspectRatio === 1 ? "1:1" : aspectRatio === 16 / 9 ? "16:9" : `${aspectRatio}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden sm:max-w-lg max-sm:max-w-[100vw] max-sm:h-[100dvh] max-sm:rounded-none max-sm:border-0 max-sm:translate-y-0 max-sm:top-0 max-sm:flex max-sm:flex-col">
        <DialogHeader className="px-4 pt-4 pb-0 sm:px-6 sm:pt-6">
          <DialogTitle>裁切圖片</DialogTitle>
          <DialogDescription>拖曳平移，雙指縮放（{ratioLabel}）</DialogDescription>
        </DialogHeader>

        {/* Crop area — taller on mobile */}
        <div className="relative w-full h-[min(60vw,350px)] sm:h-[350px] max-sm:flex-1 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
              min={1}
              max={3}
              step={0.05}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={processing} className="min-w-[100px]">
              {processing ? "處理中..." : "確認裁切"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function getCroppedImage(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = new OffscreenCanvas(crop.width, crop.height);
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.convertToBlob({ type: "image/webp", quality: 0.9 });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
