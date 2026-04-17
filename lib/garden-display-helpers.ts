/** Краткая строка для плитки грядки: названия культур (и сорт из полного имени), без «N растений». */
export function bedPlantsSummary(plants: { name: string }[]): string {
  if (plants.length === 0) return "Пока без культур";
  const parts = plants.map((p) => p.name.trim());
  if (parts.length <= 5) return parts.join(" · ");
  return `${parts.slice(0, 5).join(" · ")} · +${parts.length - 5}`;
}

export function splitCropAndVariety(displayName: string): { crop: string; variety?: string } {
  const i = displayName.indexOf(",");
  if (i === -1) return { crop: displayName.trim() };
  const crop = displayName.slice(0, i).trim();
  const variety = displayName.slice(i + 1).trim();
  return variety ? { crop, variety } : { crop };
}

type PlantWithTimeline = {
  plantedDate: string;
  timelineEvents?: { scheduledDate: string; title: string; doneAt?: string | null }[];
};

/** Ближайшая работа по таймлайну для карточки на главной. */
export function nextScheduledWorkLabel(plant: PlantWithTimeline, now = new Date()): string {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const upcoming = (plant.timelineEvents ?? [])
    .filter((e) => !e.doneAt)
    .map((e) => ({ ...e, t: new Date(e.scheduledDate).getTime() }))
    .filter((e) => e.t >= start.getTime())
    .sort((a, b) => a.t - b.t);
  const ev = upcoming[0];
  if (!ev) return "Нет запланированных работ";
  const dayStart = new Date(ev.scheduledDate);
  dayStart.setHours(0, 0, 0, 0);
  const days = Math.round((dayStart.getTime() - start.getTime()) / 86400000);
  const title = ev.title;
  if (days <= 0) return `${title} · сегодня`;
  if (days === 1) return `${title} · завтра`;
  return `${title} · через ${days} дн.`;
}
