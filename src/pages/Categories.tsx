import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Tag, Layers, FolderTree, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { useDraftForm } from "@/hooks/useDraftForm";
import { PageLoader } from "@/components/PageLoader";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";

const initialCategoryForm = { name: "", name_sw: "", description: "" };

export default function Categories() {
  const { t, language } = useLanguage();
  const [editing, setEditing] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(initialCategoryForm);
  const [addForm, setAddForm, clearAddCategoryDraft] = useDraftForm("add-category", initialCategoryForm);

  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 4;

  const { data: categories, isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const totalCategories = categories?.length || 0;
  const categorizedWithDesc = useMemo(() => categories?.filter(c => !!c.description)?.length || 0, [categories]);

  const totalMobilePages = Math.ceil(totalCategories / MOBILE_PAGE_SIZE) || 1;
  const currentMobileCategories = (categories || []).slice((mobilePage - 1) * MOBILE_PAGE_SIZE, mobilePage * MOBILE_PAGE_SIZE);

  const handleSave = async () => {
    if (editing) {
      await updateCat.mutateAsync({ id: editing.id, name: form.name, description: form.description || null });
      setEditing(null);
      setForm(initialCategoryForm);
    } else {
      await createCat.mutateAsync({ name: addForm.name, description: addForm.description || null });
      clearAddCategoryDraft();
      setIsAddOpen(false);
    }
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, name_sw: "", description: cat.description || "" });
  };

  const openAdd = () => {
    setEditing(null);
    setIsAddOpen(true);
  };

  if (categories === undefined || isLoading) {
    return <PageLoader message="Loading categories..." messageSw="Inapakia kategoria..." language={language} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Kategoria za Bidhaa" : "Product Categories"}
        subtitle={language === "sw" ? "Panga bidhaa zako kwa makundi safi na rahisi kutafuta." : "Organize inventory into clear categories that are easier to browse and manage."}
        actions={
          <Button className="gap-1.5 rounded-xl bg-neutral-950 px-3.5 text-xs font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 text-accent" />
            {language === "sw" ? "Ongeza Kategoria" : "Add Category"}
          </Button>
        }
      />

      {/* Inventory-style 2x2 KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Jumla ya Makundi" : "Total Categories"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <FolderTree className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{totalCategories}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Makundi yaliyosajiliwa" : "Registered groups"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Yenye Maelezo" : "With Details"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{categorizedWithDesc}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Yenye maelezo ya kina" : "Detailed descriptions"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Hali ya Makundi" : "Status"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-emerald-600">{language === "sw" ? "Imara" : "Active"}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Inatumika katika duka" : "In use across shop"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Mpangilio" : "Hierarchy"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">1-Tier</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Muundo mnyoofu" : "Flat structure"}</p>
          </div>
        </Card>
      </div>

      {/* Inventory-style Bottom Sheet for Edit */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{t("common.edit")} {language === "sw" ? "Kategoria" : "Category"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jina" : "Name"} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, name_sw: e.target.value })} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={language === "sw" ? "Si lazima" : "Optional"} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)} className="h-9 rounded-xl text-xs">{t("common.cancel")}</Button>
              <Button 
                className="h-9 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs px-4 transition-all" 
                onClick={handleSave} 
                disabled={!form.name || updateCat.isPending}
              >
                {updateCat.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Inventory-style Bottom Sheet for Add */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{language === "sw" ? "Ongeza Kategoria Mpya" : "Add New Category"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jina" : "Name"} *</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value, name_sw: e.target.value })} placeholder={language === "sw" ? "Jina la kategoria" : "Category name"} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} placeholder={language === "sw" ? "Si lazima" : "Optional"} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { clearAddCategoryDraft(); setIsAddOpen(false); }} className="h-9 rounded-xl text-xs">
                {t("common.cancel")}
              </Button>
              <Button 
                className="h-9 gap-1.5 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs px-4 transition-all" 
                onClick={handleSave} 
                disabled={!addForm.name || createCat.isPending}
              >
                {createCat.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Card List with 4 items & Pagination */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !categories?.length ? (
          <div className="py-12 text-center text-muted-foreground rounded-2xl border border-border bg-card p-6">
            {language === "sw" ? "Hakuna kategoria bado." : "No categories yet."}
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {currentMobileCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-border bg-card p-3.5 shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setCategoryToDeleteId(cat.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalMobilePages > 1 && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs">
                <span className="text-muted-foreground text-[11px]">
                  {mobilePage} / {totalMobilePages} ({totalCategories} {language === "sw" ? "makundi" : "categories"})
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mobilePage <= 1}
                    onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-[11px] rounded-lg"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mobilePage >= totalMobilePages}
                    onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                    className="h-7 px-2.5 text-[11px] rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Table (hidden md:block) */}
      <Card className="section-shell overflow-hidden hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="internal-table-scroll max-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "sw" ? "Jina" : "Name"}</TableHead>
                  <TableHead className="hidden md:table-cell">{language === "sw" ? "Maelezo" : "Description"}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!categories?.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-foreground/70 dark:text-foreground/80">
                      {language === "sw" ? "Hakuna kategoria bado." : "No categories yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">
                        {cat.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-foreground/70 dark:text-foreground/80 truncate max-w-xs">
                        {cat.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => setCategoryToDeleteId(cat.id)} disabled={deleteCat.isPending}>
                            <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!categoryToDeleteId} onOpenChange={(open) => !open && setCategoryToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa kategoria?" : "Delete this category?"}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDeleteId && deleteCat.mutate(categoryToDeleteId, { onSettled: () => setCategoryToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
