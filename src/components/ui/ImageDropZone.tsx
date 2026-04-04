import React, { useRef, useState, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import { optimizeImage } from "@/lib/imageOptimize";
import { ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES_DEFAULT = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_TYPES_LOGO = ["image/jpeg", "image/png"];
const MAX_RAW_SIZE = 10 * 1024 * 1024; // 10MB before optimization

interface ImageDropZoneProps {
  value: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  type: "logo" | "product";
  className?: string;
  compact?: boolean;
}

export function ImageDropZone({
  value,
  onUpload,
  onRemove,
  type,
  className = "",
  compact = false,
}: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const acceptedTypes = type === "logo" ? ACCEPTED_TYPES_LOGO : ACCEPTED_TYPES_DEFAULT;

  const processFile = useCallback(
    async (file: File) => {
      if (!acceptedTypes.includes(file.type)) {
        toast.error(type === "logo" ? "Logo must be PNG or JPG" : "Please use JPG, PNG, WebP, or GIF");
        return;
      }
      if (file.size > MAX_RAW_SIZE) {
        toast.error("Image must be under 10MB");
        return;
      }

      setUploading(true);
      try {
        const optimized = await optimizeImage(file, type);
        const blob = await upload(optimized.name, optimized, {
          access: "public",
          handleUploadUrl: "/api/upload-image",
        });
        onUpload(blob.url);
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [type, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [processFile],
  );

  // Show preview when we have a value
  if (value) {
    return (
      <div className={`relative group ${className}`}>
        <div
          className={`overflow-hidden rounded-lg border-2 border-emerald-400 bg-muted/20 flex items-center justify-center ${
            compact ? "aspect-square" : type === "logo" ? "aspect-square h-16" : "aspect-video"
          }`}
        >
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-contain p-1"
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Upload / drop zone
  return (
    <div
      className={`relative cursor-pointer ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div
        className={`rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all duration-150 ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border/60 hover:border-foreground/30 hover:bg-muted/30"
        } ${compact ? "aspect-square" : type === "logo" ? "aspect-square h-16" : "py-4"}`}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50 mt-1 text-center leading-tight">
              {compact ? "Add" : "Drop image\nor click"}
            </span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={type === "logo" ? "image/jpeg,image/png" : "image/jpeg,image/png,image/webp,image/gif"}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
