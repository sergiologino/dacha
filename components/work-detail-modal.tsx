"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { BedPlantTimelineEvent } from "@/lib/hooks/use-beds";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function WorkDetailModal({
  open,
  onOpenChange,
  plantId,
  event,
  allEvents,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: string;
  event: BedPlantTimelineEvent | null;
  allEvents: BedPlantTimelineEvent[];
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const analysis = useMemo(() => {
    if (!event) return { tooEarly: false, missedPrior: [] as BedPlantTimelineEvent[], canComplete: false };

    const today = startOfDay(new Date());
    const evStart = startOfDay(new Date(event.scheduledDate));

    const tooEarly =
      event.isAction && !event.doneAt && evStart.getTime() > today.getTime();

    const missedPrior =
      !event.isAction || event.doneAt
        ? []
        : allEvents.filter((e) => {
            if (!e.isAction || e.doneAt || e.id === event.id) return false;
            return new Date(e.scheduledDate).getTime() < new Date(event.scheduledDate).getTime();
          });

    const canComplete =
      event.isAction &&
      !event.doneAt &&
      !tooEarly &&
      missedPrior.length === 0;

    return { tooEarly, missedPrior, canComplete };
  }, [event, allEvents]);

  if (!event) return null;

  const markDone = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/plants/${plantId}/timeline/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doneAt: new Date().toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Ошибка");
      toast.success("Работа отмечена выполненной");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const readOnly = event.doneAt || !event.isAction;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl text-base sm:text-lg leading-relaxed max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl sm:text-2xl font-semibold pr-8">
          {event.title}
        </DialogTitle>

        {(analysis.tooEarly || analysis.missedPrior.length > 0) && !event.doneAt && event.isAction ? (
          <div
            className="flex gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 text-amber-900 dark:text-amber-100"
            role="status"
          >
            <AlertTriangle className="w-7 h-7 shrink-0" aria-hidden />
            <div className="space-y-2">
              {analysis.tooEarly ? (
                <p className="font-medium">По графику ещё рано выполнять эту работу.</p>
              ) : null}
              {analysis.missedPrior.length > 0 ? (
                <div>
                  <p className="font-medium">Сначала желательно сделать более ранние работы:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {analysis.missedPrior.map((e) => (
                      <li key={e.id}>
                        {e.title}
                        <span className="text-amber-800/80 dark:text-amber-200/80 ml-1">
                          (
                          {new Date(e.scheduledDate).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                          })}
                          )
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-slate-500 dark:text-slate-400">
            {event.isAction ? "Работа" : "Ориентир"} —
            {" "}
            {new Date(event.scheduledDate).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {event.dateTo
              ? ` — ${new Date(event.dateTo).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                })}`
              : null}
          </p>

          {event.description ? (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/80 p-4 text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
              {event.description}
            </div>
          ) : (
            <p className="text-slate-500">Подробное описание не задано.</p>
          )}

          {event.doneAt ? (
            <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-6 h-6" aria-hidden />
              Выполнено{" "}
              {new Date(event.doneAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto h-12 text-base rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Закрыть
          </Button>
          {!readOnly && (
            <Button
              type="button"
              className="w-full sm:w-auto h-12 text-base rounded-xl bg-emerald-600 hover:bg-emerald-700"
              disabled={!analysis.canComplete || saving}
              onClick={() => void markDone()}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Отметить выполненной"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
