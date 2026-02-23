import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/useNotifications";

type NotificationPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const { data, markAsRead, markAllRead } = useNotifications();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[520px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Notifications
            <button className="text-sm text-primary" onClick={() => markAllRead.mutate()}>Mark all read</button>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {!data?.length ? (
            <p className="text-sm text-muted-foreground">No notifications.</p>
          ) : (
            data.map((n: any) => (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read_at && markAsRead.mutate(n.id)}
                className={`w-full rounded-lg border p-3 text-left ${!n.read_at ? "bg-primary/5 border-primary/30" : ""}`}
              >
                <p className="font-medium">{n.title}</p>
                {n.message ? <p className="text-sm text-muted-foreground">{n.message}</p> : null}
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
