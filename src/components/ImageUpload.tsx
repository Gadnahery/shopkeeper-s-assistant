import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { StorageError } from "@supabase/storage-js";

interface ImageUploadProps {
  currentUrl?: string | null;
  bucket: string;
  folder: string;
  onUpload: (url: string) => void;
  variant?: "avatar" | "product";
  className?: string;
}

export function ImageUpload({ currentUrl, bucket, folder, onUpload, variant = "avatar", className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${folder}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast.success("Image uploaded!");
    } catch (err) {
      const message = err instanceof StorageError || err instanceof Error ? err.message : "Unknown upload error";
      toast.error("Upload failed: " + message);
    } finally {
      setUploading(false);
    }
  };

  if (variant === "avatar") {
    return (
      <div className={`relative inline-block ${className}`}>
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            <Camera className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : currentUrl ? (
          <img src={currentUrl} alt="Product" className="h-full max-h-28 rounded-lg object-contain" />
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload image</span>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
