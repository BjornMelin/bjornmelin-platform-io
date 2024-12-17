import { motion } from "framer-motion";

export function BlogHeader() {
  return (
    <motion.div
      className="space-y-4 text-center mb-12"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Thoughts on cloud architecture, AI/ML, and modern development
      </p>
    </motion.div>
  );
}
