import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useBlocks } from "../hooks/useBlocks";
import { useAppearance } from "../hooks/useAppearance";
import DashboardLayout from "../components/DashboardLayout";
import BlockList from "../components/BlockList";
import BlockTypeSelector from "../components/BlockTypeSelector";
import BlockEditor from "../components/BlockEditor";
import ProfileEditor from "../components/ProfileEditor";
import { getDefaultConfig, type BlockType } from "../../lib/block-types";
import type { SocialLink } from "../../lib/social-platforms";
import { Button } from "../components/ui/button";
import { Plus, Loader2, Pencil } from "lucide-react";
import { getSocialIcon } from "../components/SocialLinksEditor";

export default function Dashboard() {
  const { user } = useAuth();
  const { blocks, isLoading, mutate, createBlock, updateBlock, deleteBlock, reorderBlock } = useBlocks();
  const { appearance } = useAppearance();
  const [showSelector, setShowSelector] = useState(false);
  const [newBlockType, setNewBlockType] = useState<BlockType | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  let socialLinks: SocialLink[] = [];
  try { socialLinks = user?.socialLinks ? JSON.parse(user.socialLinks) : []; } catch { /* */ }

  const handleSelectType = (type: BlockType) => {
    setShowSelector(false);
    setNewBlockType(type);
  };

  const profileStyle = appearance?.profileStyle ?? "blend";
  const isCard = profileStyle === "card";
  const initial = (user?.displayName || user?.username || "U").charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6 space-y-4" style={{ fontFamily: `'${appearance?.fontFamily ?? "Inter"}', system-ui` }}>

        {/* Profile Preview Card */}
        <div className="relative group flex items-start gap-0.5">
          {/* Spacer to align with block drag handles */}
          <div className="w-5 shrink-0" />

          <div className="flex-1 min-w-0 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 gap-1.5"
              onClick={() => setShowProfileEditor(true)}
            >
              編輯個人檔案
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <div
              className={`rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-shadow hover:shadow-md ${isCard ? "bg-white/85 backdrop-blur shadow-sm" : ""}`}
              onClick={() => setShowProfileEditor(true)}
            >
            {/* Avatar */}
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {initial}
              </div>
            )}

            {/* Name */}
            <h2 className="text-xl font-bold text-center">
              {user?.displayName || `@${user?.username}`}
            </h2>

            {/* Bio */}
            {user?.bio && (
              <p className="text-sm text-center text-muted-foreground whitespace-pre-line max-w-sm">
                {user.bio}
              </p>
            )}

            {/* Social Icons */}
            {socialLinks.length > 0 && (
              <div className="flex gap-4 flex-wrap justify-center mt-2">
                {socialLinks.map((link, i) => {
                  const iconSrc = getSocialIcon(link.platform);
                  return iconSrc ? (
                    <img key={i} src={iconSrc} alt={link.platform} className="w-6 h-6 opacity-60" />
                  ) : null;
                })}
              </div>
            )}
            </div>
          </div>
        </div>

        <ProfileEditor open={showProfileEditor} onClose={() => setShowProfileEditor(false)} />

        {/* Block List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <BlockList
            blocks={blocks}
            appearance={appearance}
            onUpdate={async (id, data) => { await updateBlock(id, data); }}
            onDelete={async (id) => { await deleteBlock(id); }}
            onReorder={async (id, newSortOrder) => { await reorderBlock(id, newSortOrder); }}
            onMutate={() => mutate()}
          />
        )}

        {/* Add block button — at bottom */}
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => {
            setShowSelector(true);
            setNewBlockType(null);
          }}
        >
          <Plus className="h-4 w-4" />
          新增區塊
        </Button>

        <BlockTypeSelector
          open={showSelector}
          onSelect={handleSelectType}
          onClose={() => setShowSelector(false)}
        />

        {newBlockType && (
          <BlockEditor
            open={!!newBlockType}
            type={newBlockType}
            config={getDefaultConfig(newBlockType) as Record<string, unknown>}
            onSave={async (config) => {
              await createBlock(newBlockType, config);
              setNewBlockType(null);
            }}
            onClose={() => setNewBlockType(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
