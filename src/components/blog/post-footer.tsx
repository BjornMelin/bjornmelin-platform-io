import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  TwitterIcon,
  LinkedinIcon,
  FacebookIcon,
  LinkIcon,
} from "lucide-react";

interface BlogPost {
  title: string;
  slug: string;
  author: {
    name: string;
    image?: string;
    bio?: string;
  };
}

interface PostFooterProps {
  post: BlogPost;
}

function ShareButton({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      asChild
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    </Button>
  );
}

export function PostFooter({ post }: PostFooterProps) {
  const shareUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `https://yourdomain.com/blog/${post.slug}`;
  
  const shareText = `Check out "${post.title}" by ${post.author.name}`;
  
  return (
    <footer className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <ShareButton
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          className="text-blue-400 hover:text-blue-500"
        >
          <TwitterIcon className="h-4 w-4 mr-2" />
          Tweet
        </ShareButton>
        <ShareButton
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
          className="text-blue-600 hover:text-blue-700"
        >
          <LinkedinIcon className="h-4 w-4 mr-2" />
          Share
        </ShareButton>
        <ShareButton
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          className="text-blue-800 hover:text-blue-900"
        >
          <FacebookIcon className="h-4 w-4 mr-2" />
          Share
        </ShareButton>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
          }}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
      </div>

      <hr className="border-border" />

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={post.author.image} alt={post.author.name} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{post.author.name}</h3>
            {post.author.bio && (
              <p className="text-muted-foreground">{post.author.bio}</p>
            )}
          </div>
        </div>
      </Card>
    </footer>
  );
} 