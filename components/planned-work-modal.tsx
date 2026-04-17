"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

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

export type PlannedWorkEvent = {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  dateTo: string | null;
  isAction: boolean;
  type: string;
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
  try {
    return iso.slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function PlannedWorkModal({
  open,
  onOpenChange,
  mode,
  plantId: initialPlantId,
  bedId: initialBedId,
  bedName: initialBedName,
  plantName: initialPlantName,
  event,
  onSuccess,
  bedsForPick,
  onShowPaywall,
}: PlannedWorkModalProps) {
  const [pickedPlant, setPickedPlant] = useState<BedPlantOption | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => toDateInputValue(new Date().toISOString()));
  const [dateTo, setDateTo] = useState("");
  const [isAction, setIsAction] = useState(true);
  const [type, setType] = useState("other");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const needPickPlant = mode === "add" && bedsForPick && bedsForPick.length > 0 && !initialPlantId;
  const effectivePlantId = initialPlantId || pickedPlant?.plantId || "";
  const effectiveBedId = initialBedId || pickedPlant?.bedId || "";
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
      setDateTo(event.dateTo ? toDateInputValue(event.dateTo) : "");
      setIsAction(event.isAction);
      setType(event.type && EVENT_TYPES.some((t) => t.value === event.type) ? event.type : "other");
    } else {
      setTitle("");
      setDescription("");
      setScheduledDate(toDateInputValue(new Date().toISOString()));
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
        scheduledDate: `${scheduledDate}T12:00:00.000Z`,
        dateTo: dateTo ? `${dateTo}T12:00:00.000Z` : null,
        isAction,
        type,
      };
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
