"use client";

import { useState, useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import type { Bed, BedPlantTimelineEvent, OfflineEntityMeta } from "@/lib/hooks/use-beds";
import { enqueueOutbox } from "@/lib/offline/outbox";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";
import { newOfflineClientId } from "@/lib/offline/offline-id";

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "other", label: "Другое" },
  { value: "sprout", label: "Всходы" },
  { value: "transplant", label: "Пересадка" },
  { value: "water", label: "Полив" },
  { value: "loosen", label: "Рыхление" },
  { value: "light_temp", label: "Освещение/температура" },
  { value: "feed", label: "Подкормка" },
  { value: "pinch", label: "Пасынкование" },
  { value: "harvest", label: "Урожай" },
];

export const PLANNED_WORK_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

export type PlannedWorkEvent = {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  dateTo: string | null;
  isAction: boolean;
  type: string;
  offlineMeta?: OfflineEntityMeta;
};

export type BedPlantOption = { bedId: string; bedName: string; plantId: string; plantName: string };

type PlannedWorkModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  plantId: string;
  bedId: string;
  bedName: string;
  plantName: string;
  event?: PlannedWorkEvent | null;
  onSuccess: () => void;
  /** Для добавления из календаря: список грядок/растений для выбора; если передан и plantId пустой — показываем выбор растения */
  bedsForPick?: BedPlantOption[];
  /** При 402 (например истёкший триал, код PAYMENT_REQUIRED) — показать paywall */
  onShowPaywall?: () => void;
};

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return toDateInputValue(new Date().toISOString());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextHalfHourTime(): string {
  const date = new Date();
  const minutes = date.getMinutes();
  if (minutes === 0 || minutes === 30) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  if (minutes < 30) return `${String(date.getHours()).padStart(2, "0")}:30`;
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function toTimeInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return getNextHalfHourTime();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = date.getMinutes() < 30 ? "00" : "30";
  return `${hours}:${minutes}`;
}

export function combineLocalDateTime(dateValue: string, timeValue: string): string {
  const [hours = "09", minutes = "00"] = timeValue.split(":");
  const date = new Date(`${dateValue}T00:00:00`);
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

function sortTimelineEvents(ev: BedPlantTimelineEvent[]): BedPlantTimelineEvent[] {
  return [...ev].sort((a, b) => {
    const da = new Date(a.scheduledDate).getTime();
    const db = new Date(b.scheduledDate).getTime();
    if (da !== db) return da - db;
    return a.sortOrder - b.sortOrder;
  });
}

function patchBedsPlantTimeline(
  qc: QueryClient,
  plantId: string,
  updater: (events: BedPlantTimelineEvent[]) => BedPlantTimelineEvent[]
) {
  qc.setQueryData<Bed[]>(["beds"], (old) =>
    old?.map((bed) => ({
      ...bed,
      plants: (bed.plants ?? []).map((p) => {
        if (p.id !== plantId) return p;
        const next = updater(p.timelineEvents ?? []);
        return { ...p, timelineEvents: sortTimelineEvents(next) };
      }),
    }))
  );
}

export function PlannedWorkModal({
  open,
  onOpenChange,
  mode,
  plantId: initialPlantId,
  bedName: initialBedName,
  plantName: initialPlantName,
  event,
  onSuccess,
  bedsForPick,
  onShowPaywall,
}: PlannedWorkModalProps) {
  const qc = useQueryClient();
  const [pickedPlant, setPickedPlant] = useState<BedPlantOption | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => toDateInputValue(new Date().toISOString()));
  const [scheduledTime, setScheduledTime] = useState(() => getNextHalfHourTime());
  const [dateTo, setDateTo] = useState("");
  const [isAction, setIsAction] = useState(true);
  const [type, setType] = useState("other");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const needPickPlant = mode === "add" && bedsForPick && bedsForPick.length > 0 && !initialPlantId;
  const effectivePlantId = initialPlantId || pickedPlant?.plantId || "";
  const effectiveBedName = initialBedName || pickedPlant?.bedName || "";
  const effectivePlantName = initialPlantName || pickedPlant?.plantName || "";

  useEffect(() => {
    if (!open) {
      setPickedPlant(null);
      return;
    }
    if (mode === "edit" && event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setScheduledDate(toDateInputValue(event.scheduledDate));
      setScheduledTime(toTimeInputValue(event.scheduledDate));
      setDateTo(event.dateTo ? toDateInputValue(event.dateTo) : "");
      setIsAction(event.isAction);
      setType(event.type && EVENT_TYPES.some((t) => t.value === event.type) ? event.type : "other");
    } else {
      setTitle("");
      setDescription("");
      setScheduledDate(toDateInputValue(new Date().toISOString()));
      setScheduledTime(getNextHalfHourTime());
      setDateTo("");
      setIsAction(true);
      setType("other");
      if (!needPickPlant) setPickedPlant(null);
    }
  }, [open, mode, event, needPickPlant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needPickPlant && !pickedPlant) {
      toast.error("Выберите растение");
      return;
    }
    if (!title.trim()) {
      toast.error("Введите название работы");
      return;
    }
    const plantIdToUse = mode === "add" ? effectivePlantId : initialPlantId;
    if (!plantIdToUse) return;
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        scheduledDate: combineLocalDateTime(scheduledDate, scheduledTime),
        dateTo: dateTo ? combineLocalDateTime(dateTo, scheduledTime) : null,
        isAction,
        type,
      };
      if (shouldQueueOfflineMutation()) {
        if (mode === "add") {
          const beds = qc.getQueryData<Bed[]>(["beds"]);
          const plant = beds?.flatMap((b) => b.plants ?? []).find((p) => p.id === plantIdToUse);
          const dependsOn = plant?.offlineMeta?.pendingOutboxId;
          const tempEventId = newOfflineClientId();
          const maxOrder = (plant?.timelineEvents ?? []).reduce((m, e) => Math.max(m, e.sortOrder), -1);
          const optimistic: BedPlantTimelineEvent = {
            id: tempEventId,
            type: body.type,
            title: body.title,
            description: body.description,
            scheduledDate: body.scheduledDate,
            dateTo: body.dateTo,
            isAction: body.isAction,
            sortOrder: maxOrder + 1,
            doneAt: null,
            isUserCreated: true,
          };
          const outId = await enqueueOutbox({
            action: "CREATE_TIMELINE_EVENT",
            payload: { plantId: plantIdToUse, tempEventId, body },
            dependsOn,
          });
          if (!outId) throw new Error("Локальное хранилище недоступно");
          patchBedsPlantTimeline(qc, plantIdToUse, (ev) => [
            ...ev,
            { ...optimistic, offlineMeta: { pendingOutboxId: outId } },
          ]);
          toast.success("Работа добавлена (ожидает сеть)");
          onSuccess();
          onOpenChange(false);
          return;
        }
        if (mode === "edit" && event) {
          const dependsOn = event.offlineMeta?.pendingOutboxId;
          const outId = await enqueueOutbox({
            action: "PATCH_TIMELINE_EVENT",
            payload: { plantId: initialPlantId, eventId: event.id, body },
            dependsOn,
          });
          if (!outId) throw new Error("Локальное хранилище недоступно");
          patchBedsPlantTimeline(qc, initialPlantId, (ev) =>
            ev.map((x) =>
              x.id === event.id
                ? {
                    ...x,
                    title: body.title,
                    description: body.description,
                    scheduledDate: body.scheduledDate,
                    dateTo: body.dateTo,
                    isAction: body.isAction,
                    type: body.type,
                  }
                : x
            )
          );
          toast.success("Изменения сохранены локально");
          onSuccess();
          onOpenChange(false);
          return;
        }
      }
      if (mode === "add") {
        const res = await fetch(`/api/plants/${plantIdToUse}/timeline/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (
            res.status === 402 &&
            ((data as { code?: string }).code === "PAYMENT_REQUIRED" ||
              (data as { code?: string }).code === "LIMIT_PLANNED_WORKS_FREE")
          ) {
            onShowPaywall?.();
            onOpenChange(false);
            toast.error(
              (data as { error?: string }).error ||
                "Нужна подписка Премиум"
            );
            setSaving(false);
            return;
          }
          throw new Error((data as { error?: string }).error || "Ошибка сохранения");
        }
        toast.success("Работа добавлена");
      } else if (event) {
        const res = await fetch(`/api/plants/${initialPlantId}/timeline/events/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Ошибка сохранения");
        }
        toast.success("Изменения сохранены");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== "edit" || !event) return;
    if (!confirm("Удалить эту плановую работу?")) return;
    setDeleting(true);
    try {
      if (shouldQueueOfflineMutation()) {
        const dependsOn = event.offlineMeta?.pendingOutboxId;
        const outId = await enqueueOutbox({
          action: "DELETE_TIMELINE_EVENT",
          payload: { plantId: initialPlantId, eventId: event.id },
          dependsOn,
        });
        if (!outId) throw new Error("Локальное хранилище недоступно");
        patchBedsPlantTimeline(qc, initialPlantId, (ev) => ev.filter((x) => x.id !== event.id));
        toast.success("Удаление сохранено локально");
        onSuccess();
        onOpenChange(false);
        return;
      }
      const res = await fetch(`/api/plants/${initialPlantId}/timeline/events/${event.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      toast.success("Работа удалена");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-lg">
          {mode === "add" ? "Добавить плановую работу" : "Редактировать работу"}
        </DialogTitle>
        {needPickPlant ? (
          <div className="mt-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Грядка · растение</label>
            <select
              value={pickedPlant ? `${pickedPlant.bedId}:${pickedPlant.plantId}` : ""}
              onChange={(e) => {
                const v = e.target.value;
                const opt = bedsForPick!.find((b) => `${b.bedId}:${b.plantId}` === v);
                setPickedPlant(opt ?? null);
              }}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              <option value="">Выберите...</option>
              {bedsForPick!.map((b) => (
                <option key={`${b.bedId}:${b.plantId}`} value={`${b.bedId}:${b.plantId}`}>
                  {b.bedName} · {b.plantName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-slate-500 -mt-1">
            {effectiveBedName} · {effectivePlantName}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Название</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Полив, Рыхление"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Описание (необязательно)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подсказка или состав работ"
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Дата</span>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Время</span>
              <select
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                {PLANNED_WORK_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">По (необязательно)</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Тип</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAction}
              onChange={(e) => setIsAction(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Это действие (нужно выполнить)</span>
          </label>
          <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row pt-2">
            {mode === "edit" && (
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50"
                onClick={handleDelete}
                disabled={saving || deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {" "}Удалить
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={saving || (needPickPlant && !pickedPlant)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {mode === "add" ? "Добавить" : "Сохранить"}
              </Button>
            </div>
          </DialogFooter>
        </form>
        {needPickPlant && !pickedPlant && (
          <p className="text-xs text-slate-400 mt-2">Выберите грядку и растение, затем заполните форму ниже.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
