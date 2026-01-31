import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  shopName?: string;
  userName?: string;
  userRole?: string;
}

export function Header({ 
  shopName = "Colman Hardware", 
  userName = "Alex Johnson",
  userRole = "Store Manager"
}: HeaderProps) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Shop Info */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{shopName}</h2>
        <p className="text-sm text-muted-foreground">
          {formattedDate} • {formattedTime}
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-full p-2 hover:bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {userName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
