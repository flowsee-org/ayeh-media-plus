import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Image } from "@/components/ui/image";
import { Heart, MessageCircle, Loader2, NotebookPen } from "lucide-react";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

/** Instagram-style grid of the user's own posts. */
export default function MyPostsGrid({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api.entities.Post
      .filter({ author_id: userId }, { sort: "-created_date", limit: 30 })
      .then((res) => setPosts(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
        <NotebookPen className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-4">هنوز پستی منتشر نکرده‌اید.</p>
        <Link
          to="/community"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
        >
          انتشار اولین تدبّر
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((p) => (
        <Link
          key={p.id}
          to={`/community/${p.id}`}
          className="relative group aspect-square rounded-lg overflow-hidden border border-accent/10 bg-card/40"
        >
          {p.image_url ? (
            <Image src={p.image_url} fittingType="fill" className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="absolute inset-0 pattern-islamic bg-gradient-to-br from-card to-accent/10 p-2.5 flex items-center justify-center">
              <p className="text-xs text-foreground/70 leading-[1.9] line-clamp-5 text-center">{p.content}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-medium">
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {fa(p.likes_count)}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {fa(p.comments_count)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}