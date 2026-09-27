import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateCustomer } from "@/hooks/useCustomers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (customer: unknown) => void;
};

export function QuickAddCustomerSheet({ open, onOpenChange, onCreated }: Props) {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const createCustomer = useCreateCustomer();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [email, setEmail] = useState("");

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setShowMore(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(isSw ? "Weka jina la mteja" : "Enter customer name");
      return;
    }
    try {
      const customer = await createCustomer.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        customer_type: "Retail",
        credit_balance: 0,
      } as any);
      toast.success(isSw ? "Mteja ameongezwa" : "Customer added");
      onCreated?.(customer);
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.message || (isSw ? "Imeshindikana" : "Failed to add customer"));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <SheetContent side="bottom" className="rounded-t-[24px] px-5 pb-8 pt-4 sm:max-w-lg sm:mx-auto">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="text-lg font-semibold text-[#1A1D29]">
            {isSw ? "Ongeza mteja" : "Add customer"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {isSw ? "Jina na simu yanatosha kuanza." : "Name and phone are enough to start."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isSw ? "Jina" : "Name"} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isSw ? "mf. Asha Juma" : "e.g. Asha Juma"}
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isSw ? "Simu" : "Phone"}</Label>
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              className="h-11 rounded-xl"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
          >
            {isSw ? "Maelezo zaidi" : "More details"}
            {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showMore && (
            <div className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3">
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          )}

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={createCustomer.isPending}
            className="h-12 w-full rounded-xl bg-[#1A1D29] text-white hover:bg-[#2a2e3d]"
          >
            {createCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSw ? "Hifadhi mteja" : "Save customer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
