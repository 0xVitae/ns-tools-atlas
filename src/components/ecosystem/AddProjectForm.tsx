import React, { useState, useMemo } from "react";
import EmojiPicker from "emoji-picker-react";
import { EcosystemProject, CustomCategory, Category } from "@/types/ecosystem";
import {
  BASE_CATEGORIES,
  getColorForNewCategory,
  generateCategorySlug,
} from "@/data/ecosystemData";
import {
  Plus,
  X,
  Smile,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { ImageDropZone } from "@/components/ui/ImageDropZone";
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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { toast } from "sonner";

const NS_PLATFORM_URL = "https://ns.com/platform";
const STORAGE_KEY = "ns_atlas_pending_project";

interface AddProjectFormProps {
  onAddProject?: (project: Omit<EcosystemProject, "id">) => void;
  isSubmitting?: boolean;
  categories: Category[];
  isMobile?: boolean;
  /** Logged-in user's NS username — auto-added as first profile URL on create */
  nsUsername?: string | null;
  /** When provided, the form operates in edit mode with pre-filled values */
  editProject?: EcosystemProject;
  /** Called on save in edit mode */
  onSaveEdit?: (
    projectId: string,
    updates: Record<string, unknown>,
  ) => Promise<void>;
  /** When true, renders just the form content without popover/drawer wrapper */
  renderFormOnly?: boolean;
}

const CREATE_NEW_CATEGORY = "__create_new__";

export const AddProjectForm: React.FC<AddProjectFormProps> = ({
  onAddProject,
  isSubmitting,
  categories,
  isMobile = false,
  nsUsername,
  editProject: editingProject,
  onSaveEdit,
  renderFormOnly = false,
}) => {
  const isEditMode = !!editingProject;
  const creatorProfileUrl = nsUsername ? `https://ns.com/${nsUsername}` : null;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState(editingProject?.name || "");
  const [formCategory, setFormCategory] = useState<string>(
    editingProject?.category || "",
  );
  const [formDescription, setFormDescription] = useState(
    editingProject?.description || "",
  );
  const [formUrl, setFormUrl] = useState(editingProject?.url || "");
  const [formGuideUrl, setFormGuideUrl] = useState(
    editingProject?.guideUrl || "",
  );
  const [showGuideUrlInput, setShowGuideUrlInput] = useState(
    !!editingProject?.guideUrl,
  );
  const [formImageUrl, setFormImageUrl] = useState(
    editingProject?.imageUrl || "",
  );
  const [formEmoji, setFormEmoji] = useState<string | null>(
    editingProject?.emoji || null,
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Product images gallery state (max 3)
  const [formProductImages, setFormProductImages] = useState<string[]>(
    editingProject?.productImages || [],
  );

  // NS Profile URLs state (max 3) — auto-seed creator's profile on create
  const [formNsProfileUrls, setFormNsProfileUrls] = useState<string[]>(() => {
    if (editingProject?.nsProfileUrls) return editingProject.nsProfileUrls;
    return creatorProfileUrl ? [creatorProfileUrl] : [];
  });
  const [newNsProfileUrl, setNewNsProfileUrl] = useState("");
  const [showNsProfileInput, setShowNsProfileInput] = useState(false);

  // Products / Plans state
  interface FormPlan {
    name: string;
    price: string;
    interval: string;
    description: string;
    url: string;
    features: string[];
  }
  const [formPlans, setFormPlans] = useState<FormPlan[]>(
    editingProject?.plans?.map((p) => ({
      name: p.name,
      price: p.price,
      interval: p.interval || "",
      description: p.description,
      url: p.url || "",
      features: [...p.features],
    })) || [],
  );
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [newFeatureText, setNewFeatureText] = useState("");

  // New category creation state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [hasReadDocs, setHasReadDocs] = useState(false);

  const isCreatingNewCategory = formCategory === CREATE_NEW_CATEGORY;
  const MAX_PRODUCT_IMAGES = 3;

  // Auto-prepend https:// if user entered a bare domain
  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  // Strip protocol for display in inputs
  const stripProtocol = (url: string): string =>
    url.replace(/^https?:\/\//i, "");

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
  const isLogoUrlValid = !formImageUrl.trim() || isValidUrl(formImageUrl);

  // Calculate form completion as individual steps
  const completedSteps = useMemo(() => {
    const steps = [
      formEmoji || formImageUrl.trim(), // Visual identity
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
    isWebsiteUrlValid,
    isGuideUrlValid,
    formCategory,
    isCreatingNewCategory,
    newCategoryName,
    formDescription,
  ]);

  const allComplete = completedSteps.every(Boolean);

  // All steps always visible
  const showStep3 = true;
  const showStep4 = true;
  const showStep5 = true;

  // Helper to add an NS Profile URL
  const handleAddNsProfileUrl = () => {
    const url = newNsProfileUrl.trim();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL (http:// or https://)");
      return;
    }
    if (formNsProfileUrls.includes(url)) {
      toast.error("This URL is already added");
      return;
    }
    setFormNsProfileUrls([...formNsProfileUrls, url]);
    setNewNsProfileUrl("");
  };

  // Check if a profile URL belongs to the creator (non-removable)
  const isCreatorUrl = (url: string) =>
    !!creatorProfileUrl &&
    url.toLowerCase().replace(/\/+$/, "") ===
      creatorProfileUrl.toLowerCase().replace(/\/+$/, "");

  // Helper to remove an NS Profile URL
  const handleRemoveNsProfileUrl = (index: number) => {
    if (isCreatorUrl(formNsProfileUrls[index])) return;
    setFormNsProfileUrls(formNsProfileUrls.filter((_, i) => i !== index));
  };

  // Helper to remove a product image
  const handleRemoveProductImage = (index: number) => {
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

  const handleSubmit = async () => {
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
          "This category already exists. Please select it from the list.",
        );
        return;
      }
      // Check for empty slug (e.g., if name was all special chars)
      if (!customCategory?.id) {
        toast.error(
          "Please enter a valid category name with letters or numbers",
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

    // In edit mode, call onSaveEdit with only the editable fields
    if (isEditMode && onSaveEdit && editingProject) {
      await onSaveEdit(editingProject.id, {
        description: formDescription.trim() || null,
        url: formUrl.trim() || null,
        guideUrl: formGuideUrl.trim() || null,
        imageUrl: formImageUrl.trim() || null,
        emoji: formEmoji || null,
        productImages: formProductImages.length > 0 ? formProductImages : null,
        nsProfileUrls: formNsProfileUrls.length > 0 ? formNsProfileUrls : null,
        plans: formPlans.length > 0 ? formPlans : null,
      });
      return;
    }

    const projectData: Omit<EcosystemProject, "id"> = {
      name: formName.trim(),
      category: categoryToSubmit,
      description: formDescription.trim() || undefined,
      url: formUrl.trim() || undefined,
      guideUrl: formGuideUrl.trim() || undefined,
      nsProfileUrls:
        formNsProfileUrls.length > 0 ? formNsProfileUrls : undefined,
      imageUrl: formImageUrl.trim() || undefined,
      emoji: formEmoji || undefined,
      productImages:
        formProductImages.length > 0 ? formProductImages : undefined,
      plans: formPlans.length > 0 ? formPlans : undefined,
      customCategory: isCreatingNewCategory ? customCategory : undefined,
    };

    // Generate a unique state ID to correlate the redirect
    const state = crypto.randomUUID();

    // Save form data to localStorage so the callback page can submit it
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state, project: projectData, timestamp: Date.now() }),
    );

    // Build the return URL for NS platform to redirect back to
    const returnUrl = `${window.location.origin}/callback`;
    const redirectUrl = `${NS_PLATFORM_URL}?return_url=${encodeURIComponent(returnUrl)}&state=${encodeURIComponent(state)}`;

    // Redirect to NS platform
    window.location.href = redirectUrl;
  };

  // Form content shared between Popover and Drawer
  const formContent = (
    <>
      {/* Header with Progress Bar Border - Fixed at top */}
      <div className="relative bg-muted/30 flex-shrink-0">
        <div className="px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {isEditMode ? "Edit Project" : "Add Project"}
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

      {/* Scrollable content area */}
      <div className="p-4 space-y-5 overflow-y-auto flex-1 scrollbar-hide">
        {/* Prerequisite documentation checkbox */}
        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={hasReadDocs} onChange={(e) => setHasReadDocs(e.target.checked)} className="mt-0.5 accent-primary" />
          <span>
            I have read the{' '}
            <a
              href="https://www.nstools.xyz/docs/submitting-a-project"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary hover:text-primary/80"
            >
              docs
            </a>
            {' '}and applied the prerequisites
          </span>
        </label>

        {/* STEP 1: Visual Identity */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            1. Visual Identity
          </label>
          <div className="flex items-center gap-3">
            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:border-foreground/40 hover:bg-muted/40 transition-all duration-150 flex-shrink-0 group"
                >
                  {formEmoji ? (
                    <div className="relative">
                      <span className="text-3xl leading-none">{formEmoji}</span>
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

            {/* Logo Upload */}
            <ImageDropZone
              value={formImageUrl || null}
              onUpload={(url) => setFormImageUrl(url)}
              onRemove={() => setFormImageUrl("")}
              type="logo"
              className="flex-1"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            Recommended: 128×128px square PNG or JPG
          </p>
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
                placeholder="Website URL *"
                value={stripProtocol(formUrl)}
                onChange={(e) => setFormUrl(e.target.value)}
                onBlur={() => {
                  if (formUrl.trim()) setFormUrl(normalizeUrl(formUrl));
                }}
                className={`h-10 text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30 ${
                  formUrl.trim()
                    ? isWebsiteUrlValid
                      ? "border-emerald-400 focus:border-emerald-400"
                      : "border-red-400 focus:border-red-400"
                    : ""
                }`}
              />
            </div>
            {/* How to Guide - optional, toggle to show */}
            <div>
              {!showGuideUrlInput && !formGuideUrl.trim() && (
                <button
                  type="button"
                  onClick={() => setShowGuideUrlInput(true)}
                  className="h-8 px-3 text-xs font-medium border border-border/60 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Guide URL
                </button>
              )}
              {(showGuideUrlInput || formGuideUrl.trim()) && (
                <div className="flex gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  <Input
                    placeholder="How to Guide URL"
                    value={stripProtocol(formGuideUrl)}
                    onChange={(e) => setFormGuideUrl(e.target.value)}
                    onBlur={() => {
                      if (formGuideUrl.trim())
                        setFormGuideUrl(normalizeUrl(formGuideUrl));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && !formGuideUrl.trim()) {
                        setShowGuideUrlInput(false);
                      }
                    }}
                    className={`h-9 text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30 ${
                      formGuideUrl.trim()
                        ? isGuideUrlValid
                          ? "border-emerald-400 focus:border-emerald-400"
                          : "border-red-400 focus:border-red-400"
                        : ""
                    }`}
                    autoFocus={showGuideUrlInput && !formGuideUrl.trim()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuideUrlInput(false);
                      setFormGuideUrl("");
                    }}
                    className="h-9 px-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {formGuideUrl.trim() && !isGuideUrlValid && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid URL (http:// or https://)
                </p>
              )}
            </div>
            {/* NS Profile URLs */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-muted-foreground/70">
                  NS Profile URLs (optional)
                </label>
                {formNsProfileUrls.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/50">
                    {formNsProfileUrls.length} added
                  </span>
                )}
              </div>

              {/* Added URLs List - shown first */}
              {formNsProfileUrls.length > 0 && (
                <div className="space-y-1.5">
                  {formNsProfileUrls.map((url, index) => {
                    const isCreator = isCreatorUrl(url);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="flex-1 text-xs text-foreground truncate">
                          {url}
                        </span>
                        {isCreator ? (
                          <span className="text-[9px] text-muted-foreground/50 shrink-0">
                            you
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveNsProfileUrl(index)}
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add button - shown when input is hidden */}
              {!showNsProfileInput && (
                <button
                  type="button"
                  onClick={() => setShowNsProfileInput(true)}
                  className="h-8 px-3 text-xs font-medium border border-border/60 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Profile URL
                </button>
              )}

              {/* URL Input Row - shown when toggled */}
              {showNsProfileInput && (
                <div className="flex gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  <Input
                    type="url"
                    placeholder="Paste NS profile URL..."
                    value={newNsProfileUrl}
                    onChange={(e) => setNewNsProfileUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNsProfileUrl();
                        setShowNsProfileInput(false);
                      }
                      if (e.key === "Escape") {
                        setShowNsProfileInput(false);
                        setNewNsProfileUrl("");
                      }
                    }}
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData("text").trim();
                      if (
                        pastedText &&
                        (pastedText.startsWith("http://") ||
                          pastedText.startsWith("https://"))
                      ) {
                        e.preventDefault();
                        if (formNsProfileUrls.includes(pastedText)) {
                          toast.error("This URL is already added");
                          return;
                        }
                        setFormNsProfileUrls([
                          ...formNsProfileUrls,
                          pastedText,
                        ]);
                        setShowNsProfileInput(false);
                      }
                    }}
                    className="h-9 text-sm placeholder:text-muted-foreground/50 border-border/60 focus:border-foreground/30"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleAddNsProfileUrl();
                      setShowNsProfileInput(false);
                    }}
                    className="h-9 px-3 text-xs font-medium border-border/60 hover:bg-muted/50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNsProfileInput(false);
                      setNewNsProfileUrl("");
                    }}
                    className="h-9 px-2 text-xs font-medium hover:bg-muted/50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STEP 3: Classification */}
        {showStep3 && (
          <div className="space-y-2">
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
                {categories.map((cat) => (
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
          <div className="space-y-2">
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
          </div>
        )}

        {/* STEP 5: Product Images */}
        {showStep5 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                5. Media (recommended)
              </label>
              <span className="text-[10px] text-muted-foreground/50">
                {formProductImages.length}/{MAX_PRODUCT_IMAGES}
              </span>
            </div>

            {/* Image Upload Grid */}
            <div className="grid grid-cols-3 gap-2">
              {formProductImages.map((url, index) => (
                <ImageDropZone
                  key={index}
                  value={url}
                  onUpload={() => {}}
                  onRemove={() => handleRemoveProductImage(index)}
                  type="product"
                  compact
                />
              ))}
              {formProductImages.length < MAX_PRODUCT_IMAGES && (
                <ImageDropZone
                  value={null}
                  onUpload={(url) =>
                    setFormProductImages([...formProductImages, url])
                  }
                  onRemove={() => {}}
                  type="product"
                  compact
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 6: Products & Plans */}
        {showStep5 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                6. Products (optional)
              </label>
              <span className="text-[10px] text-muted-foreground/50">
                {formPlans.length} plan{formPlans.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Existing plans */}
            <div className="space-y-1.5">
              {formPlans.map((plan, idx) => (
                <div
                  key={idx}
                  className="border border-border/60 rounded-lg overflow-hidden"
                >
                  {/* Plan header — click to expand */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPlan(expandedPlan === idx ? null : idx)
                    }
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <span>{plan.name || "Untitled Plan"}</span>
                      {plan.price && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          {plan.price}
                          {plan.interval && (
                            <span className="text-emerald-500">
                              /{plan.interval}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className="p-1 text-muted-foreground/50 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormPlans(formPlans.filter((_, i) => i !== idx));
                          if (expandedPlan === idx) setExpandedPlan(null);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                          expandedPlan === idx ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded editor */}
                  {expandedPlan === idx && (
                    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40 animate-in fade-in-0 duration-150">
                      <Input
                        placeholder="Plan name *"
                        value={plan.name}
                        onChange={(e) => {
                          const updated = [...formPlans];
                          updated[idx] = { ...plan, name: e.target.value };
                          setFormPlans(updated);
                        }}
                        className="h-8 text-xs border-border/60"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Price (e.g. $5)"
                          value={plan.price}
                          onChange={(e) => {
                            const updated = [...formPlans];
                            updated[idx] = { ...plan, price: e.target.value };
                            setFormPlans(updated);
                          }}
                          className="h-8 text-xs border-border/60 flex-1"
                        />
                        <Input
                          placeholder="Interval (day, month...)"
                          value={plan.interval}
                          onChange={(e) => {
                            const updated = [...formPlans];
                            updated[idx] = {
                              ...plan,
                              interval: e.target.value,
                            };
                            setFormPlans(updated);
                          }}
                          className="h-8 text-xs border-border/60 flex-1"
                        />
                      </div>
                      <Textarea
                        placeholder="Short description..."
                        value={plan.description}
                        onChange={(e) => {
                          const updated = [...formPlans];
                          updated[idx] = {
                            ...plan,
                            description: e.target.value,
                          };
                          setFormPlans(updated);
                        }}
                        className="min-h-[40px] resize-none text-xs border-border/60"
                        maxLength={160}
                      />
                      <Input
                        placeholder="Plan URL (e.g. example.com/pricing)"
                        value={stripProtocol(plan.url)}
                        onChange={(e) => {
                          const updated = [...formPlans];
                          updated[idx] = { ...plan, url: e.target.value };
                          setFormPlans(updated);
                        }}
                        onBlur={() => {
                          if (plan.url.trim()) {
                            const updated = [...formPlans];
                            updated[idx] = {
                              ...plan,
                              url: normalizeUrl(plan.url),
                            };
                            setFormPlans(updated);
                          }
                        }}
                        className="h-8 text-xs border-border/60"
                      />
                      {/* Features list */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                          Features
                        </span>
                        {plan.features.map((feat, fi) => (
                          <div
                            key={fi}
                            className="flex items-center gap-1.5 group"
                          >
                            <span className="text-emerald-500 text-xs shrink-0">
                              &bull;
                            </span>
                            <span className="text-xs text-foreground/70 flex-1">
                              {feat}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formPlans];
                                updated[idx] = {
                                  ...plan,
                                  features: plan.features.filter(
                                    (_, i) => i !== fi,
                                  ),
                                };
                                setFormPlans(updated);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-500 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-1.5">
                          <Input
                            placeholder="Add a feature..."
                            value={expandedPlan === idx ? newFeatureText : ""}
                            onChange={(e) => setNewFeatureText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newFeatureText.trim()) {
                                e.preventDefault();
                                const updated = [...formPlans];
                                updated[idx] = {
                                  ...plan,
                                  features: [
                                    ...plan.features,
                                    newFeatureText.trim(),
                                  ],
                                };
                                setFormPlans(updated);
                                setNewFeatureText("");
                              }
                            }}
                            className="h-7 text-xs border-border/60 flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!newFeatureText.trim()}
                            onClick={() => {
                              if (!newFeatureText.trim()) return;
                              const updated = [...formPlans];
                              updated[idx] = {
                                ...plan,
                                features: [
                                  ...plan.features,
                                  newFeatureText.trim(),
                                ],
                              };
                              setFormPlans(updated);
                              setNewFeatureText("");
                            }}
                            className="h-7 px-2 text-xs border-border/60"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add plan button */}
            <button
              type="button"
              onClick={() => {
                setFormPlans([
                  ...formPlans,
                  {
                    name: "",
                    price: "",
                    interval: "",
                    description: "",
                    url: "",
                    features: [],
                  },
                ]);
                setExpandedPlan(formPlans.length);
                setNewFeatureText("");
              }}
              className="h-8 px-3 text-xs font-medium border border-dashed border-border/60 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-1.5 w-full justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Plan
            </button>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          className={`w-full h-10 text-sm font-medium transition-all duration-300 ${
            allComplete
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              : ""
          }`}
          disabled={isSubmitting || !allComplete || !hasReadDocs}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
              {isEditMode ? "Saving..." : "Redirecting..."}
            </>
          ) : (
            <>{isEditMode ? "Save Changes" : "Complete Registration"}</>
          )}
        </Button>
      </div>
    </>
  );

  // Render just the form content (used in edit panels)
  if (renderFormOnly) {
    return <div className="flex flex-col overflow-hidden">{formContent}</div>;
  }

  // Mobile: use Drawer, Desktop: use Popover
  if (isMobile) {
    return (
      <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DrawerTrigger asChild>
          <Button
            size="sm"
            className="rounded-full shadow-lg h-9 px-4 gap-1.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <div className="flex flex-col flex-1 overflow-hidden pb-safe">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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
          className="w-80 p-0 overflow-hidden border-foreground/10 shadow-xl max-h-[80vh] flex flex-col"
          sideOffset={8}
        >
          {formContent}
        </PopoverContent>
      </Popover>
    </div>
  );
};
