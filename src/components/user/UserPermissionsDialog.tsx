import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  CheckSquare,
  Square,
  Search,
  Loader2,
  Sparkles,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_PATHS, useUserPageAccess, useUpdateUserPageAccess } from "@/hooks/useUserPageAccess";

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    user_id: string;
    full_name: string;
    role?: string;
  } | null;
  shopId: string | null;
  isInitialSetup?: boolean;
  onSaved?: () => void;
}

export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
  shopId,
  isInitialSetup = false,
  onSaved,
}: UserPermissionsDialogProps) {
  const { language } = useLanguage();
  const userId = user?.user_id || null;
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: currentAllowed = [], isLoading: loadingCurrent } = useUserPageAccess(userId, shopId);
  const updateAccessMutation = useUpdateUserPageAccess(userId, shopId);

  // Sync selected paths when modal opens or user's permissions load
  useEffect(() => {
    if (open) {
      if (currentAllowed && currentAllowed.length > 0) {
        setSelectedPaths(new Set(currentAllowed));
      } else if (isInitialSetup) {
        // By default on initial setup, pre-select common operational modules
        setSelectedPaths(new Set(["/dashboard", "/sales", "/inventory", "/customers", "/orders"]));
      } else {
        setSelectedPaths(new Set());
      }
    }
  }, [open, currentAllowed, isInitialSetup]);

  const togglePath = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPaths(new Set(PAGE_PATHS.map((p) => p.path)));
  };

  const clearAll = () => {
    setSelectedPaths(new Set());
  };

  const applyPreset = (paths: string[]) => {
    setSelectedPaths(new Set(paths));
  };

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PAGE_PATHS;
    return PAGE_PATHS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.sw && p.sw.toLowerCase().includes(q)) ||
        p.path.toLowerCase().includes(q) ||
        (p.group && p.group.toLowerCase().includes(q))
    );
  }, [search]);

  // Group pages by category
  const groupedPages = useMemo(() => {
    const map = new Map<string, typeof PAGE_PATHS>();
    for (const page of filteredPages) {
      const g = page.group || "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(page);
    }
    return map;
  }, [filteredPages]);

  const handleSave = async () => {
    if (!userId || !shopId) return;

    try {
      await updateAccessMutation.mutateAsync(Array.from(selectedPaths));
      toast.success(
        language === "sw"
          ? `Ruhusa za ${user?.full_name || "mtumiaji"} zimehifadhiwa kikamilifu.`
          : `Page permissions for ${user?.full_name || "user"} saved successfully.`
      );
      onOpenChange(false);
      onSaved?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save permissions");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border bg-card">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            {isInitialSetup ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs gap-1 font-semibold">
                <Sparkles className="w-3 h-3" />
                {language === "sw" ? "Hatua ya 2 ya 2: Ruhusa za Kurasa" : "Step 2 of 2: Page Access Control"}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                {language === "sw" ? "Udhibiti wa Ufikiaji" : "Access Control"}
              </Badge>
            )}
            {user?.role && (
              <Badge variant="secondary" className="text-xs capitalize font-medium">
                {user.role}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>
              {language === "sw"
                ? `Weka Ruhusa za Kurasa: ${user?.full_name || "Mtumiaji"}`
                : `Configure Page Access: ${user?.full_name || "User"}`}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {language === "sw"
              ? "Weka alama kwenye kurasa mtumiaji huyu anazoruhusiwa kufungua. Sehemu asizoruhusiwa zitaonyesha bango la 'Ufikiaji Umezuiwa'."
              : "Select the tabs/pages this user is permitted to open. Any unselected page will display an 'Access Restricted' banner."}
          </DialogDescription>
        </DialogHeader>

        {/* Search & Quick Presets Toolbar */}
        <div className="p-4 pb-2 border-b border-border/60 bg-card/60 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={language === "sw" ? "Tafuta ukurasa..." : "Filter pages..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1"
              onClick={selectAll}
            >
              <CheckSquare className="w-3 h-3" />
              {language === "sw" ? "Zote" : "Select All"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 gap-1"
              onClick={clearAll}
            >
              <Square className="w-3 h-3" />
              {language === "sw" ? "Ondoa" : "Clear"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => applyPreset(["/dashboard", "/sales", "/customers", "/orders"])}
            >
              {language === "sw" ? "Keshia" : "Cashier"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => applyPreset(["/dashboard", "/inventory", "/purchases", "/suppliers", "/categories"])}
            >
              {language === "sw" ? "Stoo" : "Inventory"}
            </Button>
          </div>
        </div>

        {/* Checkbox List Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loadingCurrent && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>{language === "sw" ? "Inapakia ruhusa za sasa..." : "Loading current permissions..."}</span>
            </div>
          )}

          {!loadingCurrent && Array.from(groupedPages.entries()).map(([group, pages]) => (
            <div key={group} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {pages.filter((p) => selectedPaths.has(p.path)).length}/{pages.length}{" "}
                  {language === "sw" ? "zimechaguliwa" : "selected"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pages.map((item) => {
                  const isChecked = selectedPaths.has(item.path);
                  return (
                    <label
                      key={item.path}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none text-xs ${
                        isChecked
                          ? "bg-primary/10 border-primary/40 text-foreground font-medium shadow-xs"
                          : "bg-card hover:bg-muted/40 border-border text-muted-foreground"
                      }`}
                      onClick={() => togglePath(item.path)}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => togglePath(item.path)}
                          className="h-4 w-4 rounded data-[state=checked]:bg-primary"
                        />
                        <div className="truncate">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {language === "sw" && item.sw ? item.sw : item.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">{item.path}</p>
                        </div>
                      </div>
                      <Badge
                        variant={isChecked ? "default" : "outline"}
                        className={`text-[10px] h-5 px-1.5 shrink-0 ${
                          isChecked ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {isChecked ? (language === "sw" ? "Inaruhusiwa" : "Allowed") : (language === "sw" ? "Imezuiwa" : "Restricted")}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {!loadingCurrent && filteredPages.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-xs">
              {language === "sw" ? "Hakuna kurasa zilizopatikana." : "No matching pages found."}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground self-start sm:self-center">
            <strong>{selectedPaths.size}</strong> / {PAGE_PATHS.length}{" "}
            {language === "sw" ? "kurasa zinaruhusiwa" : "pages allowed"}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9"
              onClick={() => onOpenChange(false)}
            >
              {isInitialSetup
                ? (language === "sw" ? "Ruka (Toa Ruhusa Zote)" : "Skip (Grant All)")
                : (language === "sw" ? "Funga" : "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs h-9 font-semibold gap-1.5 bg-neutral-950 text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950"
              onClick={handleSave}
              disabled={updateAccessMutation.isPending}
            >
              {updateAccessMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{language === "sw" ? "Hifadhi Ruhusa" : "Save Permissions"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
