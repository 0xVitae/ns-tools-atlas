import React, { useState, useMemo } from "react";
import EmojiPicker from "emoji-picker-react";
import { EcosystemProject, CustomCategory } from "@/types/ecosystem";
import {
  BASE_CATEGORIES,
  getColorForNewCategory,
  generateCategorySlug,
} from "@/data/ecosystemData";
import { Plus, X, ImageIcon, Smile, Sparkles, Images } from "lucide-react";
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

const CREATE_NEW_CATEGORY = "__create_new__";

export const AddProjectForm: React.FC<AddProjectFormProps> = ({
  onAddProject,
  isSubmitting,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formDescription, setFormDescription] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formGuideUrl, setFormGuideUrl] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Product images gallery state (max 3)
  const [formProductImages, setFormProductImages] = useState<string[]>([]);
  const [newProductImageUrl, setNewProductImageUrl] = useState("");

  // New category creation state
  const [newCategoryName, setNewCategoryName] = useState("");

  const isCreatingNewCategory = formCategory === CREATE_NEW_CATEGORY;
  const MAX_PRODUCT_IMAGES = 3;

  // Image validation state
  const [logoImageValid, setLogoImageValid] = useState<boolean | null>(null);
  const [productImagesValid, setProductImagesValid] = useState<
    Record<number, boolean>
  >({});

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Validation states for URLs
  const isWebsiteUrlValid = isValidUrl(formUrl);
  const isGuideUrlValid = !formGuideUrl.trim() || isValidUrl(formGuideUrl);
  const isLogoUrlValid =
    !formImageUrl.trim() ||
    (isValidUrl(formImageUrl) && logoImageValid !== false);

  // Check all product images are valid
  const allProductImagesValid =
    formProductImages.length === 0 ||
    formProductImages.every((_, idx) => productImagesValid[idx] !== false);

  // Calculate form completion as individual steps
  const completedSteps = useMemo(() => {
    const steps = [
      formEmoji ||
        (formImageUrl.trim() && isLogoUrlValid && logoImageValid === true), // Visual identity (with valid image)
      formName.trim(), // Name
      isWebsiteUrlValid && isGuideUrlValid, // URLs valid
      formCategory && (!isCreatingNewCategory || newCategoryName.trim()), // Category
      formDescription.trim(), // Description
    ];
    return steps.map(Boolean);
  }, [
    formName,
    formEmoji,
    formImageUrl,
    isLogoUrlValid,
    logoImageValid,
    isWebsiteUrlValid,
    isGuideUrlValid,
    formCategory,
    isCreatingNewCategory,
    newCategoryName,
    formDescription,
  ]);

  const allComplete = completedSteps.every(Boolean);

  // Progressive reveal conditions (require valid data to proceed)
  const showStep3 = Boolean(
    formName.trim() && isWebsiteUrlValid && isGuideUrlValid
  );
  const showStep4 =
    showStep3 &&
    Boolean(formCategory && (!isCreatingNewCategory || newCategoryName.trim()));
  const showStep5 = showStep4 && Boolean(formDescription.trim());

  // Helper to add a product image
  const handleAddProductImage = () => {
    const url = newProductImageUrl.trim();
    if (!url) {
      toast.error("Please enter an image URL");
      return;
    }
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL (http:// or https://)");
      return;
    }
    if (formProductImages.length >= MAX_PRODUCT_IMAGES) {
      toast.error(`Maximum ${MAX_PRODUCT_IMAGES} images allowed`);
      return;
    }
    if (formProductImages.includes(url)) {
      toast.error("This image is already added");
      return;
    }
    setFormProductImages([...formProductImages, url]);
    setNewProductImageUrl("");
  };

  // Helper to remove a product image
  const handleRemoveProductImage = (index: number) => {
    // Remove from validation state
    const newValidState = { ...productImagesValid };
    delete newValidState[index];
    // Re-index remaining items
    const reindexed: Record<number, boolean> = {};
    Object.keys(newValidState).forEach((key) => {
      const numKey = parseInt(key);
      if (numKey > index) {
        reindexed[numKey - 1] = newValidState[numKey];
      } else {
        reindexed[numKey] = newValidState[numKey];
      }
    });
    setProductImagesValid(reindexed);
    setFormProductImages(formProductImages.filter((_, i) => i !== index));
  };

  // Compute the custom category object when creating new
  const customCategory = useMemo<CustomCategory | undefined>(() => {
    if (!isCreatingNewCategory || !newCategoryName.trim()) return undefined;
    const name = newCategoryName.trim();
    return {
      id: generateCategorySlug(name),
      name,
      color: getColorForNewCategory(name),
    };
  }, [isCreatingNewCategory, newCategoryName]);

  const handleSubmit = () => {
    if (isSubmitting) return;

    if (!formName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!formUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    if (!formCategory) {
      toast.error("Please select a category");
      return;
    }
    // Validate new category if creating new
    if (isCreatingNewCategory) {
      if (!newCategoryName.trim()) {
        toast.error("Please enter a name for the new category");
        return;
      }
      // Check for collision with existing categories
      const existingIds = BASE_CATEGORIES.map((c) => c.id);
      if (customCategory && existingIds.includes(customCategory.id)) {
        toast.error(
          "This category already exists. Please select it from the list."
        );
        return;
      }
      // Check for empty slug (e.g., if name was all special chars)
      if (!customCategory?.id) {
        toast.error(
          "Please enter a valid category name with letters or numbers"
        );
        return;
      }
    }
    if (!formDescription.trim()) {
      toast.error("Please enter a description");
      return;
    }

    // Determine the category to use
    const categoryToSubmit =
      isCreatingNewCategory && customCategory
        ? customCategory.id
        : formCategory;

    onAddProject({
      name: formName.trim(),
      category: categoryToSubmit,
      description: formDescription.trim() || undefined,
      url: formUrl.trim() || undefined,
      guideUrl: formGuideUrl.trim() || undefined,
      imageUrl: formImageUrl.trim() || undefined,
      emoji: formEmoji || undefined,
      productImages:
        formProductImages.length > 0 ? formProductImages : undefined,
      customCategory: isCreatingNewCategory ? customCategory : undefined,
    });

    // Reset form
    setFormName("");
    setFormCategory("");
    setNewCategoryName("");
    setFormDescription("");
    setFormUrl("");
    setFormGuideUrl("");
    setFormImageUrl("");
    setFormEmoji(null);
    setFormProductImages([]);
    setNewProductImageUrl("");
    setShowEmojiPicker(false);
    setLogoImageValid(null);
    setProductImagesValid({});
    setIsFormOpen(false);
  };

  return (
    <div className="z-30">
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
          className="w-80 p-0 overflow-hidden border-foreground/10 shadow-xl"
          sideOffset={8}
        >
          {/* Header with Progress Bar Border */}
          <div className="relative bg-muted/30">
            <div className="px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Add Project
              </h3>
            </div>
            {/* Progress bar as bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/30">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  allComplete
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-primary"
                }`}
                style={{
                  width: `${
                    (completedSteps.filter(Boolean).length /
                      completedSteps.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* STEP 1: Visual Identity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                1. Visual Identity
              </label>
              <div className="flex items-center gap-3">
                {/* Emoji Picker */}
                <Popover
                  open={showEmojiPicker}
                  onOpenChange={setShowEmojiPicker}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:border-foreground/40 hover:bg-muted/40 transition-all duration-150 flex-shrink-0 group"
                    >
                      {formEmoji ? (
                        <div className="relative">
                          <span className="text-3xl leading-none">
                            {formEmoji}
                          </span>
                          <button
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormEmoji(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Smile className="h-5 w-5 text-muted-foreground/60" />
                          <span className="text-[10px] text-muted-foreground/60 mt-1">
                            Emoji
                          </span>
                        </>
                      )}
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
                        setShowEmojiPicker(false);
                      }}
                      width={280}
                      height={350}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-xs text-muted-foreground/50">or</span>

                {/* Image URL Input */}
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <Input
                    type="url"
                    placeholder="Logo URL"
                    value={formImageUrl}
                    onChange={(e) => {
                      setFormImageUrl(e.target.value);
                      setLogoImageValid(null); // Reset validation on change
                    }}
                    className={`h-10 pl-9 text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30 ${
                      formImageUrl.trim() && !isValidUrl(formImageUrl)
                        ? "border-red-400 focus:border-red-400"
                        : logoImageValid === false
                        ? "border-red-400 focus:border-red-400"
                        : logoImageValid === true
                        ? "border-emerald-400 focus:border-emerald-400"
                        : ""
                    }`}
                  />
                </div>
              </div>

              {/* Image Preview */}
              {formImageUrl.trim() && isValidUrl(formImageUrl) && (
                <div
                  className={`flex items-center justify-center p-3 rounded-lg border ${
                    logoImageValid === false
                      ? "bg-red-50 border-red-200"
                      : logoImageValid === true
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-muted/30 border-border/50"
                  }`}
                >
                  <img
                    src={formImageUrl}
                    alt="Logo preview"
                    className={`max-h-16 max-w-full object-contain rounded ${
                      logoImageValid === false ? "hidden" : ""
                    }`}
                    onError={() => {
                      setLogoImageValid(false);
                    }}
                    onLoad={() => {
                      setLogoImageValid(true);
                    }}
                  />
                  {logoImageValid === false && (
                    <div className="text-xs text-red-500 flex items-center gap-1.5">
                      <X className="h-3 w-3" />
                      Failed to load image
                    </div>
                  )}
                </div>
              )}

              {/* Invalid URL message */}
              {formImageUrl.trim() && !isValidUrl(formImageUrl) && (
                <p className="text-xs text-red-500">
                  Please enter a valid URL (http:// or https://)
                </p>
              )}
            </div>

            {/* STEP 2: Basic Info */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                2. Basic Info
              </label>
              <div className="space-y-2">
                <Input
                  placeholder="Project Name *"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`h-10 text-sm font-medium placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30 ${
                    formName.trim()
                      ? "border-emerald-400 focus:border-emerald-400"
                      : ""
                  }`}
                />
                <div>
                  <Input
                    type="url"
                    placeholder="Website URL *"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className={`h-10 text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30 ${
                      formUrl.trim()
                        ? isWebsiteUrlValid
                          ? "border-emerald-400 focus:border-emerald-400"
                          : "border-red-400 focus:border-red-400"
                        : ""
                    }`}
                  />
                  {formUrl.trim() && !isWebsiteUrlValid && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid URL (http:// or https://)
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    type="url"
                    placeholder="How to Guide (recommended)"
                    value={formGuideUrl}
                    onChange={(e) => setFormGuideUrl(e.target.value)}
                    className={`h-10 text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30 ${
                      formGuideUrl.trim()
                        ? isGuideUrlValid
                          ? "border-emerald-400 focus:border-emerald-400"
                          : "border-red-400 focus:border-red-400"
                        : ""
                    }`}
                  />
                  {formGuideUrl.trim() && !isGuideUrlValid && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid URL (http:// or https://)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: Classification */}
            {showStep3 && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  3. Classification
                </label>
                <Select
                  value={formCategory}
                  onValueChange={(val) => {
                    setFormCategory(val);
                    if (val !== CREATE_NEW_CATEGORY) {
                      setNewCategoryName("");
                    }
                  }}
                >
                  <SelectTrigger className="h-10 text-sm border-border/60 focus:border-foreground/30 data-[placeholder]:text-muted-foreground/50">
                    <SelectValue placeholder="Select a category *" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {/* Divider */}
                    <div className="h-px bg-border my-1" />
                    {/* Create New Category Option */}
                    <SelectItem value={CREATE_NEW_CATEGORY}>
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">
                          Create New Category
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* New Category Name Input */}
                {isCreatingNewCategory && (
                  <div className="space-y-2 pt-2">
                    <Input
                      placeholder="Category name (e.g., Tech Hubs) *"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="h-9 text-sm font-medium placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30"
                      autoFocus
                    />
                    {customCategory && (
                      <p className="text-[10px] text-muted-foreground/60">
                        Will be created as "{customCategory.id}" after approval
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Description */}
            {showStep4 && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  4. Description
                </label>
                <Textarea
                  placeholder="Brief description of the organization... *"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="min-h-[60px] resize-none text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30"
                  maxLength={160}
                />
                {formDescription && (
                  <p className="text-[10px] text-muted-foreground/50 text-right">
                    {formDescription.length}/160
                  </p>
                )}
              </div>
            )}

            {/* STEP 5: Product Images */}
            {showStep5 && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    5. Tool Images (recommended)
                  </label>
                  <span className="text-[10px] text-muted-foreground/50">
                    {formProductImages.length}/{MAX_PRODUCT_IMAGES}
                  </span>
                </div>

                {/* URL Input Row */}
                {formProductImages.length < MAX_PRODUCT_IMAGES && (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Images className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                      <Input
                        type="url"
                        placeholder="Paste image URL..."
                        value={newProductImageUrl}
                        onChange={(e) => setNewProductImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddProductImage();
                          }
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData
                            .getData("text")
                            .trim();
                          if (
                            pastedText &&
                            (pastedText.startsWith("http://") ||
                              pastedText.startsWith("https://"))
                          ) {
                            e.preventDefault();
                            if (
                              formProductImages.length >= MAX_PRODUCT_IMAGES
                            ) {
                              toast.error(
                                `Maximum ${MAX_PRODUCT_IMAGES} images allowed`
                              );
                              return;
                            }
                            if (formProductImages.includes(pastedText)) {
                              toast.error("This image is already added");
                              return;
                            }
                            setFormProductImages([
                              ...formProductImages,
                              pastedText,
                            ]);
                          }
                        }}
                        className="h-9 pl-9 text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddProductImage}
                      className="h-9 px-3 text-xs font-medium border-border/60 hover:bg-muted/50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {/* Image Gallery Grid */}
                {formProductImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {formProductImages.map((url, index) => (
                      <div
                        key={index}
                        className={`group relative aspect-square rounded-lg overflow-hidden border-2 bg-muted/20 animate-in fade-in-0 zoom-in-95 duration-200 ${
                          productImagesValid[index] === false
                            ? "border-red-400"
                            : productImagesValid[index] === true
                            ? "border-emerald-400"
                            : "border-border/50"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className={`w-full h-full object-cover ${
                            productImagesValid[index] === false ? "hidden" : ""
                          }`}
                          onError={() => {
                            setProductImagesValid((prev) => ({
                              ...prev,
                              [index]: false,
                            }));
                          }}
                          onLoad={() => {
                            setProductImagesValid((prev) => ({
                              ...prev,
                              [index]: true,
                            }));
                          }}
                        />
                        {/* Error state */}
                        {productImagesValid[index] === false && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <X className="h-5 w-5 mb-1" />
                            <span className="text-[9px] font-medium">
                              Failed
                            </span>
                          </div>
                        )}
                        {/* Hover overlay with delete */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProductImage(index)}
                            className="w-7 h-7 rounded-full bg-white/90 text-foreground flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Index badge */}
                        <div
                          className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full text-white text-[10px] font-medium flex items-center justify-center backdrop-blur-sm ${
                            productImagesValid[index] === false
                              ? "bg-red-500"
                              : "bg-black/50"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warning if any product images failed */}
                {!allProductImagesValid && (
                  <p className="text-xs text-red-500">
                    Some images failed to load. Please remove them or use
                    different URLs.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className={`w-full h-10 text-sm font-medium transition-all duration-300 ${
                allComplete && allProductImagesValid
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                  : ""
              }`}
              disabled={
                isSubmitting ||
                !allProductImagesValid ||
                (formImageUrl.trim() && logoImageValid === false)
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>Add to Atlas</>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
