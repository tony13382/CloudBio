import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useBlocks } from "../hooks/useBlocks";
import { usePages } from "../hooks/usePages";
import { useAppearance } from "../hooks/useAppearance";
import DashboardLayout from "../components/DashboardLayout";
import BlockList from "../components/BlockList";
import BlockTypeSelector from "../components/BlockTypeSelector";
import BlockEditor from "../components/BlockEditor";
import ProfileEditor from "../components/ProfileEditor";
import PageTabs from "../components/PageTabs";
import { getDefaultConfig, type BlockType } from "../../lib/block-types";
import type { SocialLink } from "../../lib/social-platforms";
import { Button } from "../components/ui/button";
import { Plus, Loader2, Pencil } from "lucide-react";
import { getSocialIcon } from "../components/SocialLinksEditor";

export default function Dashboard() {
  const { user } = useAuth();
  const { pages, defaultPage, createPage, updatePage, deletePage } = usePages();
  const [activePageId, setActivePageId] = useState<string | null>(null);

  // Default to the main page once pages load.
  useEffect(() => {
    if (!activePageId && defaultPage) {
      setActivePageId(defaultPage.id);
    }
  }, [defaultPage, activePageId]);

  // If the active page is deleted, fall back to the main page.
  useEffect(() => {
    if (activePageId && !pages.some((p) => p.id === activePageId) && defaultPage) {
      setActivePageId(defaultPage.id);
    }
  }, [pages, activePageId, defaultPage]);

  const activePage = pages.find((p) => p.id === activePageId) ?? null;
  const isMainPage = activePage?.isDefault ?? true;

  const { blocks, isLoading, mutate, createBlock, updateBlock, deleteBlock, reorderBlock } = useBlocks(activePageId ?? undefined);
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
      <div className="max-w-2xl mx-auto p-6 space-y-4" style={{ fontFamily: `'${appearance?.fontFamily ?? "Noto Sans TC"}', system-ui` }}>

        {/* Page tabs */}
        <PageTabs
          pages={pages}
          activePageId={activePageId}
          onSelect={setActivePageId}
          onCreate={async (slug, title) => {
            const page = await createPage(slug, title);
            setActivePageId(page.id);
          }}
          onUpdate={async (id, payload) => { await updatePage(id, payload); }}
          onDelete={async (id) => { await deletePage(id); }}
        />

        {/* Profile Preview Card — only on main page */}
        {isMainPage && (
        <div className="relative group">
          <div className="relative">
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
        )}

        {/* Sub-page header preview */}
        {!isMainPage && activePage && (
          <div className="rounded-2xl bg-muted/40 px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">子頁網址</p>
              <p className="text-sm font-medium truncate">
                /{user?.username}/{activePage.slug}
              </p>
            </div>
            {activePage.title && (
              <p className="text-sm text-muted-foreground truncate max-w-[40%]">{activePage.title}</p>
            )}
          </div>
        )}

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
          disabled={!activePageId}
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
