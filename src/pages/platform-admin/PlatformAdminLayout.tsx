import { NavLink, Outlet, Link } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  Users,
  TrendingUp,
  LayoutDashboard,
  ArrowLeft,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePendingPayments } from "@/hooks/usePlatformAdmin";
import { cn } from "@/lib/utils";

export default function PlatformAdminLayout() {
  const { data: pendingPayments = [] } = usePendingPayments();
  const pendingCount = pendingPayments.length;

  const navItems = [
    {
      to: "/platform-admin",
      end: true,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      to: "/platform-admin/payments",
      end: false,
      label: "Payments",
      icon: CreditCard,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      to: "/platform-admin/subscribers",
      end: false,
      label: "Subscribers",
      icon: Users,
    },
    {
      to: "/platform-admin/revenue",
      end: false,
      label: "Revenue",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Platform Admin Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base sm:text-lg text-foreground">
                  WiseCash
                </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Platform Admin
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Link to="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Shop</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap transition-all",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.badge !== null && item.badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
