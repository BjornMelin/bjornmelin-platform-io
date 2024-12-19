import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BlogPost {
  title: string;
  publishedAt: string;
  author: {
    name: string;
    image?: string;
  };
  tags: string[];
  coverImage?: string;
  readingTime?: string;
}

interface PostHeaderProps {
  post: BlogPost;
}

export function PostHeader({ post }: PostHeaderProps) {
  return (
    <header className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author.image} alt={post.author.name} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <span>{post.author.name}</span>
          </div>
          <span>·</span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          {post.readingTime && (
            <>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </>
          )}
        </div>
      </div>
      {post.coverImage && (
        <div className="relative aspect-[2/1] overflow-hidden rounded-lg">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}
    </header>
  );
} 