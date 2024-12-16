"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ImageUpload } from "./image-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaGalleryProps {
  onSelect?: (url: string) => void;
}

export function MediaGallery({ onSelect }: MediaGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: images, isLoading } = trpc.media.listImages.useQuery();

  const filteredImages = images?.filter((image) =>
    image.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = (url: string) => {
    onSelect?.(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ImageUpload onUpload={handleImageUpload} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filteredImages?.map((image) => (
          <Card
            key={image.id}
            className="group relative aspect-square cursor-pointer overflow-hidden"
            onClick={() => onSelect?.(image.url)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.filename}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Select</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredImages?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No images found
        </div>
      )}
    </div>
  );
}
