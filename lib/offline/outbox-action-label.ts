import type { OutboxRecord } from "@/lib/offline/outbox-types";

export function outboxStatusLabel(status: OutboxRecord["status"]): string {
  switch (status) {
    case "pending":
      return "В очереди";
    case "syncing":
      return "Отправка…";
    case "failed":
      return "Ошибка";
    default:
      return status;
  }
}

export function outboxActionDescription(record: OutboxRecord): string {
  const p = record.payload as Record<string, unknown>;
  switch (record.action) {
    case "CREATE_BED":
      return `Создать грядку «${String(p.name ?? "")}»`;
    case "UPDATE_BED":
      return "Изменить грядку";
    case "DELETE_BED":
      return "Удалить грядку";
    case "CREATE_PLANT":
      return `Создать растение «${String(p.name ?? "")}»`;
    case "UPDATE_PLANT":
      return "Изменить растение";
    case "DELETE_PLANT":
      return "Удалить растение";
    case "CREATE_TIMELINE_EVENT":
      return "Добавить событие в таймлайн";
    case "PATCH_TIMELINE_EVENT":
      return "Изменить событие таймлайна";
    case "DELETE_TIMELINE_EVENT":
      return "Удалить событие таймлайна";
    case "UPLOAD_PHOTO":
      return "Загрузить фото растения";
    case "DELETE_PHOTO":
      return "Удалить фото";
    case "AI_ANALYZE_PHOTO":
      return "ИИ: анализ фото болезни";
    case "AI_CHAT_MESSAGE":
      return "ИИ: сообщение в чат";
    case "AI_TIMELINE_GENERATE":
      return "ИИ: генерация таймлайна";
    case "GUIDE_DETAIL_FETCH":
      return `Справочник: текст по «${String(p.slug ?? "")}»`;
    case "SHARE_CONTENT":
      return `Поделиться (${String(p.type ?? "")})`;
    case "GALLERY_LIKE":
      return `Галерея: лайк фото ${String(p.photoId ?? "")}`;
    case "GALLERY_COMMENT":
      return `Галерея: комментарий к ${String(p.photoId ?? "")}`;
    case "PAGE_VISIT":
      return `Аналитика: визит ${String(p.path ?? "")}`;
    case "PUSH_SUBSCRIBE":
      return "Включить push-уведомления";
    case "PUSH_UNSUBSCRIBE":
      return "Отключить push-уведомления";
    default:
      return String(record.action);
  }
}
