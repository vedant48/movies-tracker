import { useState, useEffect } from "react";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  Play,
  Plus,
  Send,
  Smile,
  X,
  Star,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
// import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const FeedPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newPostStatus, setNewPostStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user);
      return data?.user;
    };

    const fetchFeed = async (user: any) => {
      setLoading(true);
      try {
        const { data: movies } = await supabase
          .from("user_movies")
          .select("*, profiles:user_id (username, avatar_url)")
          .order("created_at", { ascending: false });

        if (!movies) {
          setPosts([]);
          return;
        }

        // Fetch likes and comments for each post
        const postIds = movies.map((post) => post.id);

        // Fetch likes
        const { data: likesData } = await supabase.from("movie_likes").select("*").in("movie_post_id", postIds);

        // Fetch comments with commenter profiles
        const { data: commentsData } = await supabase
          .from("movie_comments")
          .select("*, profiles:user_id (username, avatar_url)")
          .in("movie_post_id", postIds)
          .order("created_at", { ascending: true });

        // Combine data
        const combined = movies.map((post) => {
          const likes = likesData?.filter((like) => like.movie_post_id === post.id) || [];
          const comments = commentsData?.filter((c) => c.movie_post_id === post.id) || [];

          return {
            ...post,
            likes,
            comments,
            likedByCurrentUser: likes.some((like) => like.user_id === user?.id),
          };
        });

        setPosts(combined);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser()
      .then((user) => fetchFeed(user))
      .catch((error) => {
        console.error("Error fetching user:", error);
        setLoading(false);
      });
  }, []);

  const toggleLike = async (postId: string) => {
    if (!currentUser) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const liked = post.likedByCurrentUser;

    try {
      if (liked) {
        await supabase.from("movie_likes").delete().eq("user_id", currentUser.id).eq("movie_post_id", postId);
      } else {
        await supabase.from("movie_likes").insert({
          user_id: currentUser.id,
          movie_post_id: postId,
        });
      }

      // Update state immediately
      const updatedPosts = posts.map((p) => {
        if (p.id === postId) {
          const newLikes = liked
            ? p.likes.filter((l: any) => l.user_id !== currentUser.id)
            : [...p.likes, { user_id: currentUser.id }];

          return {
            ...p,
            likes: newLikes,
            likedByCurrentUser: !liked,
          };
        }
        return p;
      });

      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const addComment = async (postId: string) => {
    if (!currentUser || commentText.trim() === "") return;

    try {
      const { data: comment, error } = await supabase
        .from("movie_comments")
        .insert({
          user_id: currentUser.id,
          movie_post_id: postId,
          text: commentText,
        })
        .select("*, profiles:user_id (username, avatar_url)")
        .single();

      if (error) throw error;

      // Update state immediately
      const updatedPosts = posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                ...comment,
                profiles: {
                  username: currentUser.user_metadata?.username || "You",
                  avatar_url: currentUser.user_metadata?.avatar_url || "",
                },
              },
            ],
          };
        }
        return p;
      });

      setPosts(updatedPosts);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddMovie = async (movieId: number, status: "want" | "watched") => {
    if (!currentUser) return;

    try {
      // Check if movie already exists in user's list
      const { data: existing, error: checkError } = await supabase
        .from("user_movies")
        .select("id, status")
        .eq("user_id", currentUser.id)
        .eq("movie_id", movieId)
        .single();

      if (existing) {
        // Update existing entry
        const { error } = await supabase.from("user_movies").update({ status }).eq("id", existing.id);

        if (error) throw error;

        setNewPostStatus((prev) => ({
          ...prev,
          [movieId]: "updated",
        }));
      } else {
        // Create new entry
        // First, get movie details from TMDB
        const { data: movieData, error: movieError } = await supabase
          .from("tmdb_movies") // Assuming you have a TMDB proxy
          .select("*")
          .eq("id", movieId)
          .single();

        if (movieError || !movieData) throw new Error("Movie not found");

        const { error } = await supabase.from("user_movies").insert({
          user_id: currentUser.id,
          movie_id: movieId,
          title: movieData.title,
          poster_path: movieData.poster_path,
          release_date: movieData.release_date,
          runtime: movieData.runtime,
          status,
          overview: movieData.overview,
          genres: movieData.genres,
          cast: movieData.cast,
          directors: movieData.directors,
        });

        if (error) throw error;

        setNewPostStatus((prev) => ({
          ...prev,
          [movieId]: "added",
        }));
      }
    } catch (error) {
      console.error("Error adding movie:", error);
      setNewPostStatus((prev) => ({
        ...prev,
        [movieId]: "error",
      }));
    }
  };

  const renderStatusBadge = (status: "want" | "watched") => {
    if (status === "watched") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Watched
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <Bookmark className="w-3 h-3 mr-1" />
        Want to Watch
      </Badge>
    );
  };

  const getFilteredPosts = () => {
    if (activeTab === "all") return posts;
    return posts.filter((p) => p.status === activeTab);
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Movie Tracker Feed</h1>
        <p className="text-muted-foreground">See what movies your friends are watching and wanting to watch</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="watched">Watched</TabsTrigger>
          <TabsTrigger value="want">Want to Watch</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((id) => (
            <div key={id} className="bg-card rounded-xl border overflow-hidden shadow-sm">
              <div className="p-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="p-4 flex gap-4">
                <Skeleton className="w-24 aspect-[2/3] rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
              <div className="p-4 border-t flex justify-between">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-muted border rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No activity yet</h3>
          <p className="text-muted-foreground mt-2">Follow friends to see their movie activity here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-card rounded-xl border overflow-hidden shadow-sm">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.profiles?.avatar_url || ""} alt={post.profiles?.username} />
                    <AvatarFallback>{post.profiles?.username?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{post.profiles?.username || "Unknown User"}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {renderStatusBadge(post.status)}
                      <span>• {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              {/* Movie Details */}
              <div className="p-4 flex gap-4">
                <div className="w-24 flex-shrink-0">
                  <div className="rounded-lg overflow-hidden border aspect-[2/3] bg-muted">
                    {post.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${post.poster_path}`}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{post.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{post.release_date?.split("-")[0]}</span>
                        {post.runtime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {Math.floor(post.runtime / 60)}h {post.runtime % 60}m
                            </span>
                          </div>
                        )}
                        {post.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span>{post.rating}/10</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleAddMovie(post.movie_id, "want")}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Want</span>
                      </Button>
                      <Button size="sm" className="gap-1" onClick={() => handleAddMovie(post.movie_id, "watched")}>
                        {post.status === "watched" ? (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Watch</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Watched</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {post.review && (
                    <div className="mt-3 bg-muted/50 p-3 rounded-lg">
                      <p className="text-muted-foreground italic">"{post.review}"</p>
                    </div>
                  )}

                  {newPostStatus[post.movie_id] === "added" && (
                    <div className="mt-2 text-green-600 text-sm">Added to your list!</div>
                  )}
                  {newPostStatus[post.movie_id] === "updated" && (
                    <div className="mt-2 text-green-600 text-sm">Updated in your list!</div>
                  )}
                  {newPostStatus[post.movie_id] === "error" && (
                    <div className="mt-2 text-red-600 text-sm">Error updating your list</div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 py-2 border-t flex justify-between">
                <div className="flex gap-4">
                  <Button variant="ghost" size="icon" onClick={() => toggleLike(post.id)}>
                    <Heart className={`w-5 h-5 ${post.likedByCurrentUser ? "fill-red-500 text-red-500" : ""}`} />
                    <span className="sr-only">Like</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="sr-only">Comment</span>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="w-5 h-5" />
                    <span className="sr-only">Share</span>
                  </Button>
                </div>

                <Button variant="ghost" size="icon">
                  <Bookmark className={`w-5 h-5 ${false ? "fill-blue-500 text-blue-500" : ""}`} />
                  <span className="sr-only">Save</span>
                </Button>
              </div>

              {/* Likes and comments summary */}
              <div className="px-4 pb-2">
                <div className="text-sm">
                  {post.likes.length > 0 && (
                    <div className="mb-1">
                      <span className="font-medium">{post.likes.length} likes</span>
                    </div>
                  )}
                  {post.comments.length > 0 && (
                    <button
                      className="text-muted-foreground"
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    >
                      View {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
                    </button>
                  )}
                </div>
              </div>

              {/* Comments section - expanded when clicked */}
              {expandedPost === post.id && (
                <div className="border-t">
                  <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profiles?.avatar_url || ""} alt={comment.profiles?.username} />
                          <AvatarFallback>{comment.profiles?.username?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-xl px-4 py-2">
                            <div className="font-medium">{comment.profiles?.username || "Unknown"}</div>
                            <p>{comment.text}</p>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 ml-1">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add comment form */}
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addComment(post.id);
                        }}
                      />
                      <Button variant="ghost" onClick={() => addComment(post.id)} disabled={!commentText.trim()}>
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating action button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button size="lg" className="rounded-full w-14 h-14 p-0">
          <Plus className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};

export default FeedPage;
