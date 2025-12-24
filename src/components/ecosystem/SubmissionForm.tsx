import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Plus, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryType, EcosystemProject } from '@/types/ecosystem';
import { CATEGORY_COLORS } from '@/data/ecosystemData';

interface SubmissionFormProps {
  onSubmit: (project: Omit<EcosystemProject, 'id'>) => void;
}

const CATEGORY_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'networks', label: 'Networks' },
  { value: 'coworking', label: 'Coworking' },
  { value: 'media-events', label: 'Media & Events' },
  { value: 'education', label: 'Education' },
  { value: 'local-vcs', label: 'Local VCs' },
  { value: 'global-vcs', label: 'Global VCs' },
  { value: 'accelerators', label: 'Accelerators' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'public-entities', label: 'Public Entities' },
];

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType | ''>('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay
    setTimeout(() => {
      onSubmit({
        name: name.trim(),
        category: category as CategoryType,
        description: description.trim() || undefined,
        imageUrl: imagePreview || undefined,
      });

      // Reset form
      setName('');
      setCategory('');
      setDescription('');
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setIsSubmitting(false);
      toast.success('Project submitted successfully!');
    }, 500);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Submit a Project
        </CardTitle>
        <CardDescription>
          Add a new organization to the NS Ecosystem map
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo / Image</Label>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-20 h-20 mx-auto object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-1/2 translate-x-10 -translate-y-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Click to upload logo
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PNG, JPG up to 2MB
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="logo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Halifax Tech Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={(val) => setCategory(val as CategoryType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CATEGORY_COLORS[option.value] }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the organization..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/200
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Adding to Map...</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Add to Ecosystem
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
