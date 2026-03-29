"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GardenPlantPhotoImg } from "@/components/garden-plant-photo";
import { GalleryShareButton } from "@/components/gallery-share-button";
import { getGalleryPhotoUrl } from "@/lib/gallery";
import { useDeletePlantPhoto, type BedPlantPhoto } from "@/lib/hooks/use-beds";

export type GardenGalleryState =
  | {
      plantName: string;
      photos: BedPlantPhoto[];
      index: number;
    }
  | null;

export function GardenPlantGalleryDialog({
  gallery,
  setGallery,
}: {
  gallery: GardenGalleryState;
  setGallery: React.Dispatch<React.SetStateAction<GardenGalleryState>>;
}) {
  const qc = useQueryClient();
  const deletePlantPhoto = useDeletePlantPhoto();
  const [galleryCaption, setGalleryCaption] = useState("");
  const [gallerySaving, setGallerySaving] = useState(false);
  const deletingGalleryPhotoId = deletePlantPhoto.isPending
    ? deletePlantPhoto.variables ?? null
    : null;

  const closeGallery = () => setGallery(null);

  useEffect(() => {
    const currentPhoto = gallery?.photos[gallery.index];
    setGalleryCaption(currentPhoto?.caption ?? "");
  }, [gallery?.index, gallery?.photos]);

  const galleryPrev = () => {
    if (!gallery) return;
    setGallery((g) =>
      g
        ? {
            ...g,
            index: g.index > 0 ? g.index - 1 : g.photos.length - 1,
          }
        : null
    );
  };

  const galleryNext = () => {
    if (!gallery) return;
    setGallery((g) =>
      g
        ? {
            ...g,
            index: g.index < g.photos.length - 1 ? g.index + 1 : 0,
          }
        : null
    );
  };

  const updateGalleryPhoto = (
    photoId: string,
    patch: {
      caption?: string | null;
      isPublic?: boolean;
      publishedAt?: string | null;
    }
  ) => {
    setGallery((current) =>
      current
        ? {
            ...current,
            photos: current.photos.map((photo) =>
              photo.id === photoId ? { ...photo, ...patch } : photo
            ),
          }
        : current
    );
  };

  const saveGalleryPhoto = async (isPublic: boolean) => {
    const currentPhoto = gallery?.photos[gallery.index];
    if (!currentPhoto) return;

    setGallerySaving(true);
    try {
      const res = await fetch(`/api/photos/${currentPhoto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: galleryCaption.trim() || null,
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось обновить публикацию");
      }

      updateGalleryPhoto(currentPhoto.id, {
        caption: data.caption ?? null,
        isPublic: !!data.isPublic,
        publishedAt: data.publishedAt ?? null,
      });
      await qc.invalidateQueries({ queryKey: ["beds"] });
      await qc.invalidateQueries({ queryKey: ["gallery-feed"] });
      toast.success(
        data.isPublic
          ? "Фото опубликовано в галерее"
          : "Фото снято с публикации"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось обновить публикацию"
      );
    } finally {
      setGallerySaving(false);
    }
  };

  return (
    <Dialog open={!!gallery} onOpenChange={(open) => !open && closeGallery()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 w-full h-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-black/95 p-0 gap-0 flex flex-col sm:inset-[5%] sm:h-[90%] sm:max-w-4xl sm:mx-auto sm:rounded-2xl sm:border sm:border-slate-700"
      >
        <DialogDescription className="sr-only">
          Просмотр фотографий растения. Листайте стрелками или свайпом.
        </DialogDescription>
        {gallery ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-black/50 sm:rounded-t-2xl">
              <DialogTitle className="text-white font-semibold text-base">
                {gallery.plantName}
                {gallery.photos[gallery.index]?.takenAt && (
                  <span className="text-white/80 font-normal ml-1">
                    —{" "}
                    {new Date(
                      gallery.photos[gallery.index].takenAt
                    ).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
                {" — фото "}
                {gallery.index + 1} из {gallery.photos.length}
              </DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-300 hover:text-red-200 hover:bg-white/15 rounded-full"
                  title="Удалить фото"
                  aria-label="Удалить фото"
                  disabled={
                    gallerySaving ||
                    deletingGalleryPhotoId === gallery.photos[gallery.index]?.id
                  }
                  onClick={() => {
                    const id = gallery.photos[gallery.index]?.id;
                    if (!id) return;
                    deletePlantPhoto.mutate(id, {
                      onSuccess: () => {
                        setGallery((g) => {
                          if (!g) return null;
                          const photos = g.photos.filter((p) => p.id !== id);
                          if (photos.length === 0) return null;
                          const index = Math.min(g.index, photos.length - 1);
                          return { ...g, photos, index };
                        });
                      },
                    });
                  }}
                >
                  {deletingGalleryPhotoId === gallery.photos[gallery.index]?.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={closeGallery}
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative min-h-[40vh] overflow-y-auto">
              <GardenPlantPhotoImg
                key={gallery.photos[gallery.index].id}
                photoId={gallery.photos[gallery.index].id}
                className="max-w-full max-h-[70vh] w-auto object-contain bg-black"
              />
              {gallery.photos[gallery.index]?.analysisResult && (
                <div className="w-full flex-shrink-0 px-4 py-2 bg-black/60 text-white text-sm sm:rounded-b-2xl">
                  <p className="font-medium">
                    {gallery.photos[gallery.index].analysisStatus === "problem"
                      ? "Отклонения: "
                      : "Вердикт: "}
                  </p>
                  <p className="mt-0.5">
                    {gallery.photos[gallery.index].analysisResult}
                  </p>
                </div>
              )}
              <div className="w-full flex-shrink-0 px-4 py-3 bg-black/65 text-white text-sm space-y-3">
                <textarea
                  value={galleryCaption}
                  onChange={(e) => setGalleryCaption(e.target.value)}
                  rows={2}
                  maxLength={280}
                  placeholder="Подпись к публикации: что выросло, чем гордитесь, какой результат."
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm placeholder:text-white/50"
                />
                <div className="flex flex-wrap gap-2 items-center">
                  {gallery.photos[gallery.index]?.isPublic ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveGalleryPhoto(true)}
                        disabled={gallerySaving}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                      >
                        {gallerySaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Обновить публикацию
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => saveGalleryPhoto(false)}
                        disabled={gallerySaving}
                        className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        Снять с публикации
                      </Button>
                      <Button
                        asChild
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Link
                          href={`/gallery/${gallery.photos[gallery.index].id}`}
                        >
                          Открыть пост
                        </Link>
                      </Button>
                      <GalleryShareButton
                        url={getGalleryPhotoUrl(
                          gallery.photos[gallery.index].id
                        )}
                        title={galleryCaption || gallery.plantName}
                        variant="outline"
                        size="sm"
                      />
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveGalleryPhoto(true)}
                      disabled={gallerySaving}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      {gallerySaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Опубликовать в галерее
                    </Button>
                  )}
                </div>
                <p className="text-xs text-white/70">
                  Опубликованные фото попадут в общую галерею дачников, где их
                  можно лайкать, комментировать и отправлять по ссылке.
                </p>
              </div>
              {gallery.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
                    onClick={galleryPrev}
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
                    onClick={galleryNext}
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
            {gallery.photos.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3 flex-shrink-0 bg-black/50 sm:rounded-b-2xl">
                {gallery.photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setGallery((g) => (g ? { ...g, index: i } : null))
                    }
                    className={[
                      "w-2 h-2 rounded-full transition-colors",
                      i === gallery.index
                        ? "bg-emerald-400"
                        : "bg-white/40 hover:bg-white/60",
                    ].join(" ")}
                    aria-label={`Фото ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
