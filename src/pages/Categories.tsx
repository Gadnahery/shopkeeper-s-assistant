import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { motion } from "framer-motion";

export default function Categories() {
  const { t, language } = useLanguage();
  const [editing, setEditing] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", name_sw: "", description: "" });

  const { data: categories, isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const handleSave = async () => {
    if (editing) {
      await updateCat.mutateAsync({ id: editing.id, name: form.name, name_sw: form.name_sw || null, description: form.description || null });
      setEditing(null);
    } else {
      await createCat.mutateAsync({ name: form.name, name_sw: form.name_sw || null, description: form.description || null });
      setIsAddOpen(false);
    }
    setForm({ name: "", name_sw: "", description: "" });
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, name_sw: cat.name_sw || "", description: cat.description || "" });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", name_sw: "", description: "" });
    setIsAddOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          {language === "sw" ? "Kategoria za Bidhaa" : "Product Categories"}
        </h1>
        <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          {language === "sw" ? "Ongeza Kategoria" : "Add Category"}
        </Button>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit")} {language === "sw" ? "Kategoria" : "Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina (Kiingereza)" : "Name (English)"}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina (Kiswahili)" : "Name (Swahili)"}</Label>
              <Input value={form.name_sw} onChange={(e) => setForm({ ...form, name_sw: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={language === "sw" ? "Si lazima" : "Optional"} />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
              onClick={handleSave} 
              disabled={!form.name || updateCat.isPending}
            >
              {updateCat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "sw" ? "Ongeza Kategoria Mpya" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina (Kiingereza)" : "Name (English)"}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina (Kiswahili)" : "Name (Swahili)"}</Label>
              <Input value={form.name_sw} onChange={(e) => setForm({ ...form, name_sw: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={language === "sw" ? "Si lazima" : "Optional"} />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
              onClick={handleSave} 
              disabled={!form.name || createCat.isPending}
            >
              {createCat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
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
                        {language === "sw" && cat.name_sw ? cat.name_sw : cat.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-foreground/70 dark:text-foreground/80 truncate max-w-xs">
                        {cat.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => deleteCat.mutate(cat.id)} disabled={deleteCat.isPending}>
                            <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
