"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Images } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";
import { GALLERY_SYNCED_EVENT } from "@/lib/offline/sync-events";
import { GalleryShareButton } from "@/components/gallery-share-button";
import {
  galleryPhotoImageSrc,
  getGalleryPhotoUrl,
  type GalleryPhoto,
} from "@/lib/gallery";

export function GalleryFeed() {
  const { status } = useSession();
  const [items, setItems] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onGallerySynced = () => {
      fetch("/api/gallery")
        .then((res) => res.json())
        .then((data) => setItems(data.items ?? []))
        .catch(() => {});
    };
    window.addEventListener(GALLERY_SYNCED_EVENT, onGallerySynced);
    return () => window.removeEventListener(GALLERY_SYNCED_EVENT, onGallerySynced);
  }, []);

  const toggleLike = async (photoId: string) => {
    if (status !== "authenticated") {
      toast.message("Чтобы ставить лайки, войдите в аккаунт");
      return;
    }

    setLikingId(photoId);
    try {
      const item = items.find((i) => i.id === photoId);
      const nextLiked = !item?.likedByViewer;

      if (shouldQueueOfflineMutation()) {
        const outId = await enqueueOutbox({
          action: "GALLERY_LIKE",
          payload: { photoId, setLiked: nextLiked },
        });
        if (!outId) throw new Error("Нет доступа к хранилищу");
        setItems((prev) =>
          prev.map((it) =>
            it.id === photoId
              ? {
                  ...it,
                  likedByViewer: nextLiked,
                  likesCount: Math.max(
                    0,
                    it.likesCount + (nextLiked ? 1 : -1)
                  ),
                }
              : it
          )
        );
        toast.message("Лайк в очереди на синхронизацию");
        return;
      }

      const res = await fetch(`/api/gallery/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setLiked: nextLiked }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось поставить лайк");
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === photoId
            ? {
                ...it,
                likedByViewer: !!data.liked,
                likesCount:
                  typeof data.likesCount === "number"
                    ? data.likesCount
                    : it.likesCount,
              }
            : it
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось поставить лайк"
      );
    } finally {
      setLikingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="overflow-hidden animate-pulse">
            <div className="aspect-[4/5] bg-slate-200 dark:bg-slate-800" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Images className="w-14 h-14 mx-auto text-emerald-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Галерея пока пустая</h2>
        <p className="text-sm text-slate-500">
          Опубликуйте первое фото со своего участка и покажите результат другим дачникам.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const shareUrl = getGalleryPhotoUrl(item.id);
        return (
          <Card key={item.id} className="overflow-hidden flex flex-col">
            <Link href={`/gallery/${item.id}`} className="block">
              <img
                src={galleryPhotoImageSrc(item.id)}
                alt={item.caption || item.plantName || "Фото из галереи"}
                className="w-full aspect-[4/5] object-cover"
              />
            </Link>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={item.user.image || ""} />
                  <AvatarFallback>
                    {item.user.name?.[0] || "Д"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.user.name || "Дачник"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.plantName || "Фото растения"}
                    {item.bedName ? ` • ${item.bedName}` : ""}
                  </p>
                </div>
              </div>

              {item.caption && (
                <p className="text-sm leading-relaxed">{item.caption}</p>
              )}

              {item.analysisResult && (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {item.analysisStatus === "problem" ? "Отклонения: " : "Вердикт: "}
                  {item.analysisResult}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(item.id)}
                    disabled={likingId === item.id}
                    className={`rounded-xl ${item.likedByViewer ? "text-rose-600" : ""}`}
                  >
                    <Heart
                      className={`w-4 h-4 mr-1 ${item.likedByViewer ? "fill-current" : ""}`}
                    />
                    {item.likesCount}
                  </Button>

                  <Button asChild type="button" variant="ghost" size="sm" className="rounded-xl">
                    <Link href={`/gallery/${item.id}`}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {item.commentsCount}
                    </Link>
                  </Button>
                </div>

                <GalleryShareButton
                  url={shareUrl}
                  title={item.caption || item.plantName || "Фото из галереи"}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
