import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type BannerSlide = {
  url: string;
  linkUrl?: string;
  alt?: string;
  label?: string;
  labelColor?: string;
  labelPosition?: string;
  description?: string;
  descriptionAlign?: string;
};

type Props = {
  images: BannerSlide[];
  autoplay?: boolean;
  /** Per-slide width as CSS value. Default "100%" (full width, next slide hidden). */
  slideWidth?: string;
  /** Optional fixed slide image height in px. If omitted, images use their
   * natural aspect ratio (width: 100%, height: auto). */
  slideHeight?: number;
  /** Gap between slides in px. Default 8. */
  gap?: number;
  /** Description font size in px. Default 12. */
  descriptionFontSize?: number;
  /** Hide the controls row entirely (useful for tiny previews). */
  hideControls?: boolean;
  /** Autoplay interval in ms. Default 4000. */
  interval?: number;
  /** When true, slides render as plain divs (no <a>) so clicks bubble up to
   * the parent — used in the dashboard where clicking a block should open
   * the editor instead of navigating to the slide's linkUrl. */
  disableLinks?: boolean;
};

/**
 * Shared banner carousel used on BioPage (SPA), BlockList dashboard preview,
 * and PhonePreview. Uses native scroll-snap for the scroller and wires up
 * dot indicators, prev/next buttons, and autoplay on top.
 *
 * The SSR path has an equivalent HTML + inline vanilla script in src/ssr.
 */
export default function BannerCarousel({
  images,
  autoplay = false,
  slideWidth = "100%",
  slideHeight,
  gap = 8,
  descriptionFontSize = 12,
  hideControls = false,
  interval = 4000,
  disableLinks = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const pausedRef = useRef(false);
  const multi = images.length > 1;

  const slideWidthPx = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.firstElementChild) return 0;
    return (el.firstElementChild as HTMLElement).offsetWidth + gap;
  }, [gap]);

  const goTo = useCallback(
    (i: number) => {
      const el = scrollRef.current;
      if (!el || images.length === 0) return;
      const n = images.length;
      const target = ((i % n) + n) % n;
      const w = slideWidthPx();
      el.scrollTo({ left: target * w, behavior: "smooth" });
    },
    [images.length, slideWidthPx]
  );

  // Sync dot state with actual scroll position.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const w = slideWidthPx();
    if (!w) return;
    setCurrent(Math.round(el.scrollLeft / w));
  };

  // Autoplay — calculate from DOM each tick to avoid stale state in the closure.
  useEffect(() => {
    if (!autoplay || !multi) return;
    const t = setInterval(() => {
      if (pausedRef.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const w = slideWidthPx();
      if (!w) return;
      const cur = Math.round(el.scrollLeft / w);
      const next = (cur + 1) % images.length;
      el.scrollTo({ left: next * w, behavior: "smooth" });
    }, interval);
    return () => clearInterval(t);
  }, [autoplay, multi, images.length, interval, slideWidthPx]);

  if (images.length === 0) return null;

  return (
    <div
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div
        ref={scrollRef}
        className="banner-carousel"
        onScroll={handleScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          gap,
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
        }}
      >
        {images.map((img, i) => {
          const inner = (
            <div style={{ flex: `0 0 ${slideWidth}`, scrollSnapAlign: "start" }}>
              <div style={{ position: "relative" }}>
                <img
                  src={img.url}
                  alt={img.alt || ""}
                  style={{
                    width: "100%",
                    height: slideHeight ?? "auto",
                    objectFit: slideHeight ? "cover" : undefined,
                    borderRadius: 12,
                    display: "block",
                  }}
                />
                {img.label && (
                  <LabelOverlay
                    label={img.label}
                    color={img.labelColor}
                    position={img.labelPosition}
                  />
                )}
              </div>
              {img.description && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: descriptionFontSize,
                    opacity: 0.7,
                    textAlign:
                      (img.descriptionAlign as "left" | "center" | "right") ||
                      "center",
                  }}
                >
                  {img.description}
                </p>
              )}
            </div>
          );
          return img.linkUrl && !disableLinks ? (
            <a
              key={i}
              href={img.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: `0 0 ${slideWidth}`,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {inner}
            </a>
          ) : (
            <div key={i} style={{ flex: `0 0 ${slideWidth}` }}>
              {inner}
            </div>
          );
        })}
      </div>

      {!hideControls && multi && (
        <div className="banner-controls">
          <div className="banner-arrows">
            <button
              type="button"
              className="banner-prev"
              aria-label="上一張"
              onClick={(e) => {
                e.stopPropagation();
                goTo(current - 1);
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="banner-next"
              aria-label="下一張"
              onClick={(e) => {
                e.stopPropagation();
                goTo(current + 1);
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="banner-dots">
            {images.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`banner-dot${i === current ? " active" : ""}`}
                aria-label={`第 ${i + 1} 張`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LabelOverlay({
  label,
  color,
  position,
}: {
  label?: string;
  color?: string;
  position?: string;
}) {
  if (!label) return null;
  const posMap: Record<string, React.CSSProperties> = {
    "top-left": { top: 8, left: 8 },
    "top-right": { top: 8, right: 8 },
    "bottom-left": { bottom: 8, left: 8 },
    "bottom-right": { bottom: 8, right: 8 },
  };
  return (
    <span
      style={{
        position: "absolute",
        ...posMap[position || "top-left"],
        background: color || "#000",
        color: "#fff",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: "0.75rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
