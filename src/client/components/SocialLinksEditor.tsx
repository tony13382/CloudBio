import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SOCIAL_PLATFORMS, type SocialLink } from "../../lib/social-platforms";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

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
    <div className="space-y-3">
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

              <Select value={link.platform} onValueChange={(v) => updateLink(i, "platform", v)}>
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((p) => {
                    const pIcon = getSocialIcon(p.id);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          {pIcon && <img src={pIcon} alt="" className="h-4 w-4 opacity-70" />}
                          {p.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
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

export { getSocialIcon };
