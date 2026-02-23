import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

export default function Notifications() {
  const { data, markAsRead, markAllRead, unreadCount } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={unreadCount === 0}>
          Mark all read
        </Button>
      </div>
      <Card className="glass-card">
        <CardHeader><CardTitle>All notifications</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!data?.length ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
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
