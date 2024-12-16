"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaGallery } from "../../media/media-gallery";

interface MediaPickerProps {
  onSelect: (url: string) => void;
  trigger: React.ReactNode;
}

export function MediaPicker({ onSelect, trigger }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (url: string) => {
    onSelect(url);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] sm:h-[600px]">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex-1 overflow-y-auto">
          <MediaGallery onSelect={handleSelect} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
