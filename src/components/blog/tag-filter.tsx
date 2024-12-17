import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface TagFilterProps {
  tag: string;
  isSelected: boolean;
  onSelect: (tag: string) => void;
}

export function TagFilter({ tag, isSelected, onSelect }: TagFilterProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Badge
        variant={isSelected ? "default" : "secondary"}
        className={`cursor-pointer px-4 py-2 text-sm ${
          isSelected ? "hover:bg-primary/80" : "hover:bg-secondary/80"
        }`}
        onClick={() => onSelect(tag)}
      >
        {tag}
      </Badge>
    </motion.div>
  );
}
