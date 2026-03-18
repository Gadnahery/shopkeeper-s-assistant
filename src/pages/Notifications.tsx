import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function Notifications() {
  const { language } = useLanguage();
  const { data, isLoading, markAsRead, markAllRead, unreadCount } = useNotifications();

  if (data === undefined || isLoading) {
    return <PageLoader message="Loading notifications..." messageSw="Inapakia arifa..." language={language} />;
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={language === "sw" ? "Fuatilia notifications mpya, zilizosomeka, na taarifa muhimu za duka lako." : "Review unread updates, activity alerts, and important store notifications in one clean feed."}
        actions={
          <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0}>
            {language === "sw" ? "Soma zote" : "Mark all read"}
          </Button>
        }
      />
      <Card className="section-shell">
        <CardHeader><CardTitle>{language === "sw" ? "Notifications zote" : "All notifications"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!data?.length ? (
            <p className="text-sm text-muted-foreground">{language === "sw" ? "Hakuna notifications bado." : "No notifications yet."}</p>
          ) : (
            data.map((n: any) => (
              <button
                type="button"
                key={n.id}
                onClick={() => !n.read_at && markAsRead.mutate(n.id)}
                className={`w-full text-left rounded-lg border p-3 hover:bg-muted/40 transition ${!n.read_at ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <p className="font-medium">{n.title}</p>
                {n.message ? <p className="text-sm text-muted-foreground">{n.message}</p> : null}
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
