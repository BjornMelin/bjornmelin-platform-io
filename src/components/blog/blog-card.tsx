import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types/blog";

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function BlogCard({ post, priority = false }: BlogCardProps) {
  return (
    <motion.div variants={item}>
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="p-0">
            {post.coverImage && (
              <div className="aspect-video relative">
                <Image
                  src={post.coverImage}
                  alt={post.coverImageAlt || post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={priority}
                  placeholder={post.coverImageBlur ? "blur" : "empty"}
                  blurDataURL={post.coverImageBlur}
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {post.category && (
              <Badge variant="secondary" className="mb-2">
                {post.category}
              </Badge>
            )}
            <div className="flex gap-2 mb-4 flex-wrap">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <h2 className="text-xl font-semibold mb-2 line-clamp-2">
              {post.title}
            </h2>
            <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
            {post.author && (
              <div className="flex items-center gap-2 mt-4">
                {post.author.image && (
                  <Image
                    src={post.author.image}
                    alt={post.author.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {post.author.name}
                  {post.author.role && ` · ${post.author.role}`}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="px-6 pb-6 pt-0">
            <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              <div className="flex items-center gap-4">
                {post.readingTime && (
                  <span>{post.readingTime} read</span>
                )}
                {post.viewCount !== undefined && (
                  <span>{post.viewCount.toLocaleString()} views</span>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
