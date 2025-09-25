"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  className?: string;
}

export function ImageUpload({ onImageUploaded, className = "" }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB");
      return;
    }

    // Clear previous errors
    setError(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Try to parse the error as JSON, but handle HTML responses
        try {
          const text = await response.text();
          // Check if the response is HTML
          if (text.trim().startsWith('<')) {
            if (response.status === 413) {
              throw new Error("Image is too large. Please use a smaller image (max 2MB).");
            } else {
              throw new Error(`Server error: ${response.status}`);
            }
          }
          
          // Try to parse as JSON
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || "Failed to upload image");
        } catch (parseError) {
          // If JSON parsing fails, use the error we already created or a generic one
          if (parseError instanceof Error && parseError.message !== "Unexpected token < in JSON at position 0") {
            throw parseError;
          }
          throw new Error("Failed to upload image. Please try a smaller image.");
        }
      }

      const data = await response.json();
      onImageUploaded(data.url);
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError(err.message || "Failed to upload image");
      setSelectedImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        capture="environment"
      />

      {!selectedImage ? (
        <Card className="border-dashed cursor-pointer hover:bg-accent/5 transition-colors">
          <CardContent 
            className="flex flex-col items-center justify-center p-6 text-center"
            onClick={triggerFileInput}
          >
            <div className="mb-4 p-3 rounded-full bg-accent/10">
              <ImageIcon className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm font-medium mb-1">Add a cover image</p>
            <p className="text-xs text-muted-foreground mb-4">
              Upload an image to make your story stand out
            </p>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.capture = "environment";
                    fileInputRef.current.click();
                  }
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute("capture");
                    fileInputRef.current.click();
                  }
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={selectedImage} 
            alt="Selected" 
            className="w-full h-48 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
