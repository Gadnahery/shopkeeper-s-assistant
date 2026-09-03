import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Info,
  Loader2,
  Plus,
  Save,
  ScanLine,
  Tag,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useCreateProduct } from "@/hooks/useProducts";
import { useDraftForm } from "@/hooks/useDraftForm";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUpload } from "@/components/ImageUpload";
import { PageLoader } from "@/components/PageLoader";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { cn } from "@/lib/utils";

export default function AddProduct() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { shopId } = useAuth();
  const { isMobile } = useAdaptiveLayout();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createProduct = useCreateProduct();
  const createCategory = useCreateCategory();

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", name_sw: "", description: "" });

  const initialProductForm = {
    name: "",
    name_sw: "",
    category_id: "",
    barcode: "",
    image_url: "",
    unit_type: "piece",
    buying_price: "",
    selling_price: "",
    stock: "",
    low_stock_alert: "5",
  };
  const [formData, setFormData, clearProductDraft] = useDraftForm("add-product", initialProductForm);

  if (categories === undefined || categoriesLoading) {
    return <PageLoader message="Loading..." messageSw="Inapakia..." language={language} />;
  }

  const generateCode = () => {
    const prefix = formData.name.substring(0, 3).toUpperCase() || "PRD";
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync({
      name: formData.name,
      category_id: formData.category_id || null,
      barcode: formData.barcode || generateCode(),
      image_url: formData.image_url || null,
      unit: formData.unit_type || "pcs",
      buying_price: parseFloat(formData.buying_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      stock: parseInt(formData.stock) || 0,
      low_stock_alert: parseInt(formData.low_stock_alert) || 5,
      shop_id: shopId!,
    });
    clearProductDraft();
    navigate("/inventory");
  };

  const getCategoryName = (category: NonNullable<typeof categories>[0]) => {
    return category.name;
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    const created = await createCategory.mutateAsync({
      name: categoryForm.name.trim(),
      description: categoryForm.description || null,
    });
    setFormData((current) => ({ ...current, category_id: created.id }));
    setCategoryForm({ name: "", name_sw: "", description: "" });
    setAddCategoryOpen(false);
  };

  const advancedFields = (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <Label>{t("addProduct.buyingPrice")}</Label>
        <Input
          type="number"
          placeholder="0.00"
          className="mt-2"
          value={formData.buying_price}
          onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
        />
      </div>

      <div>
        <Label>{t("addProduct.lowStockAlert")}</Label>
        <Input
          type="number"
          placeholder="5"
          className="mt-2"
          value={formData.low_stock_alert}
          onChange={(e) => setFormData({ ...formData, low_stock_alert: e.target.value })}
        />
        <p className="mt-1 text-sm text-foreground/70 dark:text-foreground/80">{t("addProduct.lowStockHint")}</p>
      </div>

      <div>
        <Label>{t("addProduct.barcode")}</Label>
        <div className="mt-2 flex items-center gap-2">
          <ScanLine className="h-4 w-4 shrink-0 text-primary" />
          <Input
            placeholder={t("addProduct.scanOrEnter")}
            className="flex-1"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            title={
              language === "sw"
                ? "Lenga hapa na uscan na skana ya USB (external)"
                : "Focus here and scan with external USB barcode scanner"
            }
            autoComplete="off"
          />
        </div>
        <p className="mt-1 text-xs text-foreground/70 dark:text-foreground/80">
          {language === "sw"
            ? "Lenga sehemu hii, fungua skana ya USB, na uscan bidhaa"
            : "Focus this field, then scan with your USB barcode scanner"}
        </p>
      </div>

      <div>
        <Label>{t("addProduct.unitType")}</Label>
        <Select value={formData.unit_type} onValueChange={(value) => setFormData({ ...formData, unit_type: value })}>
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
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={t("addProduct.title")}
        subtitle={
          language === "sw"
            ? "Ongeza taarifa muhimu kwanza, kisha fungua sehemu ya advanced ukiihitaji."
            : "Capture the essentials first, then open advanced settings only when you need them."
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/inventory")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("addProduct.back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={cn("grid gap-6", !isMobile && "xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)]")}>
          <Card className="section-shell">
            <CardContent className="space-y-6 p-4 md:p-6">
              <div className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                <div>
                  <h2 className="text-lg font-semibold">{language === "sw" ? "Taarifa muhimu" : "Essential details"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {language === "sw" ? "Onyesha jina, bei ya kuuza, na stoki kwanza." : "Show the product name, selling price, and stock first."}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="name">{t("addProduct.productName")}</Label>
                <Input
                  id="name"
                  placeholder={t("addProduct.productNamePlaceholder")}
                  className="mt-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, name_sw: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>{t("addProduct.category")}</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={t("addProduct.selectCategory")} /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryName(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button type="button" variant="outline" className="gap-1 sm:shrink-0" onClick={() => setAddCategoryOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("addProduct.addCategoryNow")}
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>{t("addProduct.sellingPrice")}</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="mt-2"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>{t("addProduct.initialStock")}</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="mt-2"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="section-shell">
              <CardContent className="space-y-5 p-4 md:p-6">
                <div className="flex items-center gap-2 text-primary">
                  <ImageIcon className="h-5 w-5" />
                  <div>
                    <h2 className="text-lg font-semibold">{language === "sw" ? "Picha ya bidhaa" : "Product media"}</h2>
                    <p className="text-sm text-muted-foreground">
                      {language === "sw" ? "Picha husaidia kutambua bidhaa kwa haraka." : "An image helps staff spot the right item faster."}
                    </p>
                  </div>
                </div>

                <div className={cn("gap-3", isMobile ? "space-y-3" : "grid md:grid-cols-[auto_minmax(0,1fr)]")}>
                  <ImageUpload
                    currentUrl={formData.image_url || null}
                    bucket="avatars"
                    folder={shopId ? `products/${shopId}` : "products"}
                    onUpload={(url) => setFormData((current) => ({ ...current, image_url: url }))}
                    variant="product"
                  />
                  <div>
                    <Label>{language === "sw" ? "Au bandika URL" : "Or paste image URL"}</Label>
                    <Input
                      placeholder={language === "sw" ? "Bandika URL ya picha" : "Paste image URL"}
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {isMobile ? (
              <Card className="section-shell">
                <CardContent className="p-4">
                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-secondary">
                        <Tag className="h-5 w-5" />
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">{language === "sw" ? "Advanced" : "Advanced settings"}</h2>
                          <p className="text-sm text-muted-foreground">
                            {language === "sw" ? "Onyesha barcode, alert, na bei ya kununua ukizihitaji." : "Reveal barcode, stock alerts, and buying price only when needed."}
                          </p>
                        </div>
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="gap-2">
                          {advancedOpen ? (language === "sw" ? "Funga" : "Hide") : (language === "sw" ? "Fungua" : "Open")}
                          {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="pt-5">
                      {advancedFields}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ) : (
              <Card className="section-shell">
                <CardContent className="space-y-5 p-4 md:p-6">
                  <div className="flex items-center gap-2 text-secondary">
                    <Tag className="h-5 w-5" />
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{t("addProduct.pricingStock")}</h2>
                      <p className="text-sm text-muted-foreground">
                        {language === "sw" ? "Hapa ndipo unafafanua barcode, alert, na maelezo ya ziada." : "This is where barcode, alerts, and supporting product details live."}
                      </p>
                    </div>
                  </div>
                  {advancedFields}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="section-shell">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {language === "sw" ? "Tayari kuhifadhi?" : "Ready to save?"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "sw"
                  ? "Bidhaa itahifadhiwa kwenye hesabu mara moja."
                  : "The product will appear in inventory as soon as you save it."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => { clearProductDraft(); navigate("/inventory"); }} className="rounded-xl">
                {t("addProduct.cancel")}
              </Button>
              <Button
                type="submit"
                className="gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                disabled={createProduct.isPending}
              >
                {createProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-accent" />}
                {t("addProduct.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{language === "sw" ? "Ongeza Kategoria Mpya" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina" : "Name"}</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, name_sw: e.target.value })}
                placeholder={language === "sw" ? "Jina la kategoria" : "Category name"}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder={language === "sw" ? "Si lazima" : "Optional"}
                className="rounded-xl"
              />
            </div>
            <Button
              type="button"
              className="w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
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
