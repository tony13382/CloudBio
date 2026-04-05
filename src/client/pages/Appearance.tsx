import { useBlocks } from "../hooks/useBlocks";
import { usePages } from "../hooks/usePages";
import { useAppearance } from "../hooks/useAppearance";
import DashboardLayout from "../components/DashboardLayout";
import ThemeEditor from "../components/ThemeEditor";
import PhonePreview from "../components/PhonePreview";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2 } from "lucide-react";
import type { SocialLink } from "../../lib/social-platforms";

export default function Appearance() {
  const { user } = useAuth();
  let socialLinks: SocialLink[] = [];
  try { socialLinks = user?.socialLinks ? JSON.parse(user.socialLinks) : []; } catch { /* */ }
  const { defaultPage } = usePages();
  const { blocks } = useBlocks(defaultPage?.id);
  const { appearance, isLoading, updateAppearance } = useAppearance();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>自訂外觀</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeEditor appearance={appearance} onChange={updateAppearance} />
              </CardContent>
            </Card>

            <div className="lg:sticky lg:top-20 lg:self-start">
              <h2 className="text-lg font-semibold mb-4 text-center">即時預覽</h2>
              <PhonePreview
                username={user?.username ?? ""}
                displayName={user?.displayName ?? null}
                bio={user?.bio ?? null}
                blocks={blocks}
                appearance={appearance}
                socialLinks={socialLinks}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
