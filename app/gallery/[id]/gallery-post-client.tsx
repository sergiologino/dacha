"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GalleryShareButton } from "@/components/gallery-share-button";
import { getGalleryPhotoUrl, type GalleryComment, type GalleryPhoto } from "@/lib/gallery";

export function GalleryPostClient({ photoId }: { photoId: string }) {
  const { status } = useSession();
  const [item, setItem] = useState<GalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    fetch(`/api/gallery/${photoId}`)
      .then((res) => res.json())
      .then((data) => setItem(data.item ?? null))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [photoId]);

  const toggleLike = async () => {
    if (status !== "authenticated") {
      toast.message("Чтобы ставить лайки, войдите в аккаунт");
      return;
    }
    if (!item) return;

    setLiking(true);
    try {
      const res = await fetch(`/api/gallery/${item.id}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось поставить лайк");
      setItem((prev) =>
        prev
          ? {
              ...prev,
              likedByViewer: !!data.liked,
              likesCount:
                typeof data.likesCount === "number"
                  ? data.likesCount
                  : prev.likesCount,
            }
          : prev
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось поставить лайк"
      );
    } finally {
      setLiking(false);
    }
  };

  const postComment = async () => {
    if (status !== "authenticated") {
      toast.message("Чтобы комментировать, войдите в аккаунт");
      return;
    }
    if (!item || !comment.trim()) return;

    setPostingComment(true);
    try {
      const res = await fetch(`/api/gallery/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить комментарий");

      setItem((prev) =>
        prev
          ? {
              ...prev,
              commentsCount:
                typeof data.commentsCount === "number"
                  ? data.commentsCount
                  : prev.commentsCount + 1,
              comments: [data.comment as GalleryComment, ...(prev.comments ?? [])],
            }
          : prev
      );
      setComment("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось отправить комментарий"
      );
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden animate-pulse">
        <div className="aspect-[4/5] bg-slate-200 dark:bg-slate-800" />
        <div className="p-6 space-y-3">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </Card>
    );
  }

  if (!item) {
    return (
      <Card className="p-10 text-center">
        <p className="text-slate-500">Публикация не найдена или уже снята с публикации.</p>
        <Button asChild className="mt-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700">
          <Link href="/gallery">Вернуться в галерею</Link>
        </Button>
      </Card>
    );
  }

  const shareUrl = getGalleryPhotoUrl(item.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <Card className="overflow-hidden">
        <img
          src={item.url}
          alt={item.caption || item.plantName || "Фото из галереи"}
          className="w-full max-h-[75vh] object-contain bg-black/5"
        />
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={item.user.image || ""} />
              <AvatarFallback>{item.user.name?.[0] || "Д"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{item.user.name || "Дачник"}</p>
              <p className="text-xs text-slate-500">
                {new Date(item.publishedAt || item.takenAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {(item.plantName || item.bedName) && (
            <p className="text-sm text-slate-500 mb-3">
              {item.plantName || "Растение"}
              {item.bedName ? ` • ${item.bedName}` : ""}
            </p>
          )}

          {item.caption && (
            <p className="text-sm leading-relaxed mb-4">{item.caption}</p>
          )}

          {item.analysisResult && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {item.analysisStatus === "problem" ? "Отклонения: " : "Вердикт: "}
              {item.analysisResult}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={toggleLike}
              disabled={liking}
              className={`rounded-xl ${item.likedByViewer ? "text-rose-600 border-rose-200" : ""}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${item.likedByViewer ? "fill-current" : ""}`} />
              {item.likesCount}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" disabled>
              <MessageCircle className="w-4 h-4 mr-1" />
              {item.commentsCount}
            </Button>
            <GalleryShareButton
              url={shareUrl}
              title={item.caption || item.plantName || "Фото из галереи"}
              variant="outline"
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Комментарии</h2>
          <div className="flex flex-col gap-3 mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Напишите комментарий по фото или результату..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm"
            />
            <Button
              type="button"
              onClick={postComment}
              disabled={postingComment || !comment.trim()}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
            >
              Отправить комментарий
            </Button>
          </div>

          <div className="space-y-3">
            {(item.comments ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">
                Пока нет комментариев. Можно начать обсуждение первым.
              </p>
            ) : (
              item.comments!.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={entry.user.image || ""} />
                      <AvatarFallback>{entry.user.name?.[0] || "Д"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{entry.user.name || "Дачник"}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(entry.createdAt).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
