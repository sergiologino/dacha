"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WorkDetailModal } from "@/components/work-detail-modal";
import { GardenPlantPhotoImg } from "@/components/garden-plant-photo";
import {
  GardenPlantGalleryDialog,
  type GardenGalleryState,
} from "@/components/garden-plant-gallery-dialog";
import { Button } from "@/components/ui/button";
import { useDeletePlantPhoto, type BedPlantPhoto, type BedPlantTimelineEvent } from "@/lib/hooks/use-beds";
import { Camera, ChevronRight, Loader2, Trash2 } from "lucide-react";

const FAR_FUTURE_DAYS = 21;

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatRu(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PlantWorksList({
  plantId,
  plantName,
  events,
  photos,
}: {
  plantId: string;
  plantName: string;
  events: BedPlantTimelineEvent[];
  photos: BedPlantPhoto[];
}) {
  const qc = useQueryClient();
  const deletePlantPhoto = useDeletePlantPhoto();
  const [openEvent, setOpenEvent] = useState<BedPlantTimelineEvent | null>(null);
  const [gallery, setGallery] = useState<GardenGalleryState>(null);
  const deletingPhotoId = deletePlantPhoto.isPending ? deletePlantPhoto.variables ?? null : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = addDays(today, FAR_FUTURE_DAYS);

  const incompleteActions = events.filter((e) => e.isAction && !e.doneAt);
  const farFuture = incompleteActions.filter((e) => new Date(e.scheduledDate) > cutoff);
  const activeIncomplete = incompleteActions.filter((e) => new Date(e.scheduledDate) <= cutoff);
  const overdue = activeIncomplete
    .filter((e) => new Date(e.scheduledDate) < today)
    .sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));
  const upcoming = activeIncomplete
    .filter((e) => new Date(e.scheduledDate) >= today)
    .sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));

  const historyEvents = events.filter((e) => {
    if (e.doneAt) return true;
    if (!e.isAction) {
      const d = new Date(e.scheduledDate);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }
    return false;
  });

  const sortedPhotos = [...(photos ?? [])].sort(
    (a, b) => +new Date(b.takenAt) - +new Date(a.takenAt)
  );

  const historySorted = [...historyEvents].sort(
    (a, b) =>
      new Date(b.doneAt ?? b.scheduledDate).getTime() -
      new Date(a.doneAt ?? a.scheduledDate).getTime()
  );

  const rowBtn =
    "w-full text-left rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 min-h-[3.75rem] flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-800 transition-colors";

  const openWork = (e: BedPlantTimelineEvent) => setOpenEvent(e);

  const openPhotoGallery = (ph: BedPlantPhoto) => {
    const index = sortedPhotos.findIndex((p) => p.id === ph.id);
    setGallery({
      plantName,
      photos: sortedPhotos,
      index: index < 0 ? 0 : index,
    });
  };

  return (
      <div className="space-y-8">
        {farFuture.length > 0 ? (
          <section aria-labelledby="later-heading">
            <details className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-4 text-lg font-medium text-slate-600 dark:text-slate-300">
                <span id="later-heading">
                  Дальше по календарю ({farFuture.length})
                </span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <ul className="px-3 pb-3 space-y-2">
                {farFuture
                  .sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate))
                  .map((e) => (
                    <li key={e.id}>
                      <button type="button" className={`${rowBtn} opacity-90`} onClick={() => openWork(e)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">
                            {e.title}
                          </p>
                          <p className="text-base text-slate-500 mt-0.5">{formatRu(e.scheduledDate)}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 shrink-0 text-slate-400" aria-hidden />
                      </button>
                    </li>
                  ))}
              </ul>
            </details>
          </section>
        ) : null}

        <section aria-labelledby="work-heading">
          <h2 id="work-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Работы по графику
        </h2>
          <div className="space-y-2">
            {overdue.length > 0 ? (
              <div className="mb-4">
                <p className="text-base font-semibold text-red-700 dark:text-red-400 mb-2">
                  Просрочено — сделайте в первую очередь
                </p>
                <ul className="space-y-2">
                  {overdue.map((e) => (
                    <li key={e.id}>
                      <button type="button" className={`${rowBtn} border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20`} onClick={() => openWork(e)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {e.title}
                          </p>
                          <p className="text-base text-red-700/90 dark:text-red-300/90">
                            Было: {formatRu(e.scheduledDate)}
                          </p>
                        </div>
                        <ChevronRight className="w-6 h-6 shrink-0" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {upcoming.length > 0 ? (
              <ul className="space-y-2">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <button type="button" className={rowBtn} onClick={() => openWork(e)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100">
                          {e.title}
                        </p>
                        <p className="text-base text-slate-600 dark:text-slate-400">
                          {formatRu(e.scheduledDate)}
                          {e.dateTo
                            ? ` — ${new Date(e.dateTo).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`
                            : null}
                        </p>
                      </div>
                      <ChevronRight className="w-6 h-6 shrink-0 text-slate-400" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : overdue.length === 0 ? (
              <p className="text-lg text-slate-500 py-4">Нет запланированных работ в ближайшие недели.</p>
            ) : null}
          </div>
        </section>

        {sortedPhotos.length > 0 ? (
          <section aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Camera className="w-7 h-7 text-emerald-600" aria-hidden />
              Фотографии с грядки
            </h2>
            <ul className="space-y-3">
              {sortedPhotos.map((ph) => (
                <li key={ph.id} className="flex gap-1 items-stretch rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 sm:p-2">
                  <button
                    type="button"
                    onClick={() => openPhotoGallery(ph)}
                    className="flex gap-4 flex-1 min-w-0 items-center p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/90 active:bg-slate-100 dark:active:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                      <GardenPlantPhotoImg
                        photoId={ph.id}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base text-slate-500">{formatRu(ph.takenAt)}</p>
                      {ph.analysisResult ? (
                        <p className="text-base sm:text-lg mt-1 text-slate-800 dark:text-slate-200 line-clamp-4">
                          {ph.analysisResult}
                        </p>
                      ) : (
                        <p className="text-base text-slate-400 mt-1">Фото без описания анализа</p>
                      )}
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                        Нажмите — подпись, публикация в галерее, комментарии
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 shrink-0 text-slate-400 self-center" aria-hidden />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 self-center h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                    title="Удалить фото"
                    aria-label="Удалить фото"
                    disabled={deletingPhotoId === ph.id}
                    onClick={() =>
                      deletePlantPhoto.mutate(ph.id, {
                        onSuccess: () => {
                          setGallery((g) => {
                            if (!g) return null;
                            const next = g.photos.filter((p) => p.id !== ph.id);
                            if (next.length === 0) return null;
                            return { ...g, photos: next, index: Math.min(g.index, next.length - 1) };
                          });
                        },
                      })
                    }
                  >
                    {deletingPhotoId === ph.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {historySorted.length > 0 ? (
          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Уже сделано и прошлые отметки
            </h2>
            <ul className="space-y-2">
              {historySorted.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    className={`${rowBtn} bg-slate-50/80 dark:bg-slate-800/30`}
                    onClick={() => openWork(ev)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">
                        {ev.title}
                        {ev.doneAt ? (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-normal">
                            (выполнено)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-base text-slate-500">
                        {ev.doneAt ? formatRu(ev.doneAt) : formatRu(ev.scheduledDate)}
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 shrink-0 text-slate-400" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <GardenPlantGalleryDialog gallery={gallery} setGallery={setGallery} />

        <WorkDetailModal
          open={!!openEvent}
          onOpenChange={(v) => !v && setOpenEvent(null)}
          plantId={plantId}
          event={openEvent}
          allEvents={events}
          onSuccess={() => void qc.invalidateQueries({ queryKey: ["beds"] })}
        />
      </div>
  );
}
