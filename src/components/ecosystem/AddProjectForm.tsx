import React, { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { EcosystemProject, CategoryType } from "@/types/ecosystem";
import { CATEGORY_COLORS } from "@/data/ecosystemData";
import { Plus, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface AddProjectFormProps {
  onAddProject: (project: Omit<EcosystemProject, "id">) => void;
  isSubmitting?: boolean;
}

const CATEGORY_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: "networks", label: "Networks" },
  { value: "coworking", label: "Coworking" },
  { value: "media-events", label: "Media & Events" },
  { value: "education", label: "Education" },
  { value: "local-vcs", label: "Local VCs" },
  { value: "global-vcs", label: "Global VCs" },
  { value: "accelerators", label: "Accelerators" },
  { value: "corporate", label: "Corporate" },
  { value: "public-entities", label: "Public Entities" },
  { value: "transport", label: "Transport" },
];

export const AddProjectForm: React.FC<AddProjectFormProps> = ({
  onAddProject,
  isSubmitting,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<CategoryType | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    if (!formName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!formCategory) {
      toast.error("Please select a category");
      return;
    }

    onAddProject({
      name: formName.trim(),
      category: formCategory,
      description: formDescription.trim() || undefined,
      url: formUrl.trim() || undefined,
      imageUrl: formImage || undefined,
      emoji: formEmoji || undefined,
    });

    // Reset form
    setFormName("");
    setFormCategory("");
    setFormDescription("");
    setFormUrl("");
    setFormImage(null);
    setFormEmoji(null);
    setShowEmojiPicker(false);
    setIsFormOpen(false);
  };

  return (
    <div className="absolute bottom-6 right-6 z-30">
      <Popover open={isFormOpen} onOpenChange={setIsFormOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 px-6 gap-2 text-base"
          >
            <Plus className="h-5 w-5" />
            Add Project
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-72 p-0 overflow-hidden border-foreground/10 shadow-xl"
          sideOffset={8}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border/50 bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Add Project
            </h3>
          </div>

          <div className="p-3 space-y-3">
            {/* Icon Row - Compact inline layout */}
            <div className="flex items-center gap-2">
              {/* Upload/Preview Box */}
              <div
                className="w-11 h-11 border border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-foreground/40 hover:bg-muted/40 transition-all duration-150 flex-shrink-0 group"
                onClick={() => fileInputRef.current?.click()}
              >
                {formImage ? (
                  <div className="relative">
                    <img
                      src={formImage}
                      alt="Preview"
                      className="w-9 h-9 object-cover rounded"
                    />
                    <button
                      className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormImage(null);
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : formEmoji ? (
                  <div className="relative">
                    <span className="text-2xl leading-none">{formEmoji}</span>
                    <button
                      className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormEmoji(null);
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground/60 transition-colors" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                or
              </span>

              {/* Emoji Button */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-11 h-11 border border-dashed border-border rounded-lg flex items-center justify-center hover:border-foreground/40 hover:bg-muted/40 transition-all duration-150 text-lg flex-shrink-0"
                  >
                    {formEmoji || "😀"}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-foreground/10"
                  side="left"
                  align="start"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setFormEmoji(emojiData.emoji);
                      setFormImage(null);
                      setShowEmojiPicker(false);
                    }}
                    width={280}
                    height={350}
                  />
                </PopoverContent>
              </Popover>

              {/* Name Input - Takes remaining space */}
              <Input
                placeholder="Name *"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-11 flex-1 text-sm font-medium placeholder:text-muted-foreground/60 border-border/60 focus:border-foreground/30"
              />
            </div>

            {/* URL Input */}
            <Input
              type="url"
              placeholder="Website URL"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="h-9 text-sm placeholder:text-muted-foreground/60 border-border/60 focus:border-foreground/30"
            />

            {/* Category + Description Row */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={formCategory}
                onValueChange={(val) => setFormCategory(val as CategoryType)}
              >
                <SelectTrigger className="h-9 text-sm border-border/60 focus:border-foreground/30">
                  <SelectValue placeholder="Category *" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: CATEGORY_COLORS[opt.value],
                          }}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-9 min-h-9 resize-none text-sm placeholder:text-muted-foreground/60 border-border/60 focus:border-foreground/30 py-2"
                maxLength={100}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full h-9 text-sm font-medium tracking-wide"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Submit Project
                </>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
