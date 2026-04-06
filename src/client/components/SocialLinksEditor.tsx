import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SOCIAL_PLATFORMS, type SocialLink } from "../../lib/social-platforms";
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

const svgModules = import.meta.glob("../assets/social/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

function getSocialIcon(platform: string): string | undefined {
  return svgModules[`../assets/social/${platform}.svg`];
}

type Props = {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
};

export default function SocialLinksEditor({ links, onChange }: Props) {
  const addLink = () => {
    const usedPlatforms = new Set(links.map((l) => l.platform));
    const available = SOCIAL_PLATFORMS.find((p) => !usedPlatforms.has(p.id));
    onChange([...links, { platform: available?.id || "website", url: "" }]);
  };

  const updateLink = (index: number, field: "platform" | "url", value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const updated = [...links];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-sm font-semibold">社群媒體連結</Label>

      {links.map((link, i) => {
        const platformInfo = SOCIAL_PLATFORMS.find((p) => p.id === link.platform);

        return (
          <div key={i} className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              {/* Move up/down */}
              <div className="flex flex-col shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground"
                  disabled={i === 0}
                  onClick={() => moveLink(i, -1)}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground"
                  disabled={i === links.length - 1}
                  onClick={() => moveLink(i, 1)}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              <PlatformCombobox
                value={link.platform}
                onChange={(v) => updateLink(i, "platform", v)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeLink(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input
              value={link.url}
              onChange={(e) => updateLink(i, "url", e.target.value)}
              placeholder={platformInfo?.placeholder || "https://..."}
              className="bg-background"
            />
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={addLink}
      >
        <Plus className="h-4 w-4" />
        新增社群連結
      </Button>
    </div>
  );
}

function PlatformCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = SOCIAL_PLATFORMS.find((p) => p.id === value);
  const selectedIcon = selected ? getSocialIcon(selected.id) : undefined;

  const filtered = query
    ? SOCIAL_PLATFORMS.filter(
        (p) =>
          p.label.toLowerCase().includes(query.toLowerCase()) ||
          p.id.toLowerCase().includes(query.toLowerCase())
      )
    : SOCIAL_PLATFORMS;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (platformId: string) => {
    onChange(platformId);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedIcon && <img src={selectedIcon} alt="" className="h-4 w-4 opacity-70" />}
          {selected?.label || "選擇平台"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg bg-popover shadow-lg ring-1 ring-border/40">
          <div className="p-1.5 border-b border-border/30">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋平台..."
              className="w-full rounded-sm bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">找不到相關平台</p>
            ) : (
              filtered.map((p) => {
                const icon = getSocialIcon(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer ${
                      p.id === value ? "bg-accent font-medium" : ""
                    }`}
                  >
                    {icon && <img src={icon} alt="" className="h-4 w-4 opacity-70" />}
                    {p.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { getSocialIcon };
