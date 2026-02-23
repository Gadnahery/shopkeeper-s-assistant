import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Info, Tag, Save, Loader2, ScanLine, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useCreateProduct } from "@/hooks/useProducts";
import { useDraftForm } from "@/hooks/useDraftForm";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUpload } from "@/components/ImageUpload";
import { motion } from "framer-motion";

export default function AddProduct() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { shopId } = useAuth();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const createCategory = useCreateCategory();

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", name_sw: "", description: "" });

  const initialProductForm = {
    name: "", name_sw: "", category_id: "", barcode: "", image_url: "",
    unit_type: "piece", buying_price: "", selling_price: "",
    stock: "", low_stock_alert: "5",
  };
  const [formData, setFormData, clearProductDraft] = useDraftForm("add-product", initialProductForm);

  const generateCode = () => {
    const prefix = formData.name.substring(0, 3).toUpperCase() || "PRD";
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync({
      name: formData.name,
      name_sw: formData.name_sw || null,
      code: generateCode(),
      category_id: formData.category_id || null,
      barcode: formData.barcode || null,
      image_url: formData.image_url || null,
      unit_type: formData.unit_type,
      buying_price: parseFloat(formData.buying_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      stock: parseInt(formData.stock) || 0,
      low_stock_alert: parseInt(formData.low_stock_alert) || 5,
      shop_id: shopId!,
    });
    clearProductDraft();
    navigate("/inventory");
  };

  const getCategoryName = (cat: NonNullable<typeof categories>[0]) => {
    return language === "sw" && cat.name_sw ? cat.name_sw : cat.name;
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    const created = await createCategory.mutateAsync({ name: categoryForm.name.trim(), name_sw: categoryForm.name_sw || null, description: categoryForm.description || null });
    setFormData((f) => ({ ...f, category_id: created.id }));
    setCategoryForm({ name: "", name_sw: "", description: "" });
    setAddCategoryOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t("addProduct.title")}</h1>
          <Button variant="outline" onClick={() => navigate("/inventory")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("addProduct.back")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <div className="mb-6 flex items-center gap-2 text-primary">
                  <Info className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">{t("addProduct.generalInfo")}</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">{t("addProduct.productName")}</Label>
                    <Input id="name" placeholder={t("addProduct.productNamePlaceholder")} className="mt-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, name_sw: e.target.value })} required />
                  </div>
                  <div>
                    <Label>{t("addProduct.category")}</Label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                        <SelectTrigger className="min-w-[180px] flex-1"><SelectValue placeholder={t("addProduct.selectCategory")} /></SelectTrigger>
                        <SelectContent>
                          {categories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{getCategoryName(cat)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => setAddCategoryOpen(true)}>
                        <Plus className="h-4 w-4" />
                        {t("addProduct.addCategoryNow")}
                      </Button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>{t("addProduct.productImage")}</Label>
                    <div className="mt-2 flex items-start gap-2">
                      <ImageUpload
                        currentUrl={formData.image_url || null}
                        bucket="avatars"
                        folder={shopId ? `products/${shopId}` : "products"}
                        onUpload={(url) => setFormData((f) => ({ ...f, image_url: url }))}
                        variant="product"
                      />
                      <Input placeholder={language === "sw" ? "Au bandika URL" : "Or paste image URL"} value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label>{t("addProduct.barcode")}</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <ScanLine className="h-4 w-4 text-primary shrink-0" />
                      <Input
                        placeholder={t("addProduct.scanOrEnter")}
                        className="flex-1"
                        value={formData.barcode}
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                        title={language === "sw" ? "Lenga hapa na uscan na skana ya USB (external)" : "Focus here and scan with external USB barcode scanner"}
                        autoComplete="off"
                      />
                    </div>
                    <p className="mt-1 text-xs text-foreground/70 dark:text-foreground/80">
                      {language === "sw" ? "Lenga sehemu hii, fungua skana ya USB, na uscan bidhaa" : "Focus this field, then scan with your USB barcode scanner"}
                    </p>
                  </div>
                  <div>
                    <Label>{t("addProduct.unitType")}</Label>
                    <Select value={formData.unit_type} onValueChange={v => setFormData({ ...formData, unit_type: v })}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">{t("unit.piece")}</SelectItem>
                        <SelectItem value="kg">{t("unit.kg")}</SelectItem>
                        <SelectItem value="meter">{t("unit.meter")}</SelectItem>
                        <SelectItem value="liter">{t("unit.liter")}</SelectItem>
                        <SelectItem value="box">{t("unit.box")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8">
                <div className="mb-6 flex items-center gap-2 text-secondary">
                  <Tag className="h-5 w-5" />
                  <h2 className="text-lg font-semibold text-foreground">{t("addProduct.pricingStock")}</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label>{t("addProduct.buyingPrice")}</Label>
                    <Input type="number" placeholder="0.00" className="mt-2" value={formData.buying_price} onChange={e => setFormData({ ...formData, buying_price: e.target.value })} />
                  </div>
                  <div>
                    <Label>{t("addProduct.sellingPrice")}</Label>
                    <Input type="number" placeholder="0.00" className="mt-2" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} required />
                  </div>
                  <div>
                    <Label>{t("addProduct.initialStock")}</Label>
                    <Input type="number" placeholder="0" className="mt-2" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                  </div>
                  <div>
                    <Label>{t("addProduct.lowStockAlert")}</Label>
                    <Input type="number" placeholder="5" className="mt-2" value={formData.low_stock_alert} onChange={e => setFormData({ ...formData, low_stock_alert: e.target.value })} />
                    <p className="mt-1 text-sm text-foreground/70 dark:text-foreground/80">{t("addProduct.lowStockHint")}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                <Button type="button" variant="outline" onClick={() => { clearProductDraft(); navigate("/inventory"); }}>{t("addProduct.cancel")}</Button>
                <Button 
                  type="submit" 
                  className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                  disabled={createProduct.isPending}
                >
                  {createProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("addProduct.save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "sw" ? "Ongeza Kategoria Mpya" : "Add New Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === "sw" ? "Jina" : "Name"}</Label>
                <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, name_sw: e.target.value })} placeholder={language === "sw" ? "Jina la kategoria" : "Category name"} />
              </div>
              <div className="space-y-2">
                <Label>{language === "sw" ? "Maelezo" : "Description"}</Label>
                <Input value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder={language === "sw" ? "Si lazima" : "Optional"} />
              </div>
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold"
                onClick={handleAddCategory}
                disabled={!categoryForm.name.trim() || createCategory.isPending}
              >
                {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
  );
}