import { useInfiniteQuery } from "@tanstack/react-query";
import type { BlogQuery, BlogPaginatedResponse } from "@/types/blog";

type FetchPostsParams = BlogQuery & {
  pageParam?: string;
};

async function fetchPosts({
  pageParam,
  limit = 9,
  tag,
  search,
  category,
  authorId,
  orderBy = "latest",
  published = true,
}: FetchPostsParams): Promise<BlogPaginatedResponse> {
  try {
    const params = new URLSearchParams();
    if (pageParam) params.set("cursor", pageParam);
    if (limit) params.set("limit", limit.toString());
    if (tag) params.set("tag", tag);
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (authorId) params.set("authorId", authorId);
    params.set("orderBy", orderBy);
    params.set("published", published.toString());

    const response = await fetch(`/api/posts?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.items,
      nextCursor: data.nextCursor,
      totalCount: data.totalCount,
      hasMore: data.hasMore,
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while fetching posts");
  }
}

export function useInfinitePosts(options: BlogQuery = {}) {
  const {
    limit = 9,
    tag,
    search,
    category,
    authorId,
    orderBy = "latest",
    published = true,
  } = options;

  return useInfiniteQuery<BlogPaginatedResponse, Error>({
    queryKey: [
      "posts",
      { tag, search, category, authorId, limit, orderBy, published },
    ],
    queryFn: async ({ pageParam = undefined }) =>
      fetchPosts({
        pageParam: pageParam as string | undefined,
        limit,
        tag,
        search,
        category,
        authorId,
        orderBy,
        published,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}
